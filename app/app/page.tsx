'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import dayjs from 'dayjs';

interface PerformancePair {
    timestamp: Date;
    seconds: number;
    category: 'OFFICE' | 'WEEKNIGHT' | 'WEEKEND';
    contactName?: string;
    body?: string;
    chatId: string;
}

interface PendingMessage {
    messageId: string;
    chatId: string;
    timestamp: number;
    body: string;
    contactName: string;
}

interface ExcludedChat {
    chat_id: string;
    note: string;
    created_at: string;
}

export default function Home() {
    const [performanceData, setPerformanceData] = useState<PerformancePair[]>([]);
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
    const [excludedList, setExcludedList] = useState<ExcludedChat[]>([]);
    const [currentDuration, setCurrentDuration] = useState(7);
    const [anchorDate, setAnchorDate] = useState(''); 
    const [filterType, setFilterType] = useState('ALL');
    const [status, setStatus] = useState('Loading...');
    const [isMounted, setIsMounted] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [showSettings, setShowSettings] = useState(false);

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000); 
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        
        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (s > 0 || parts.length === 0) parts.push(`${s}s`);
        
        return parts.join(' ');
    };

    const fetchExcluded = useCallback(async () => {
        try {
            const res = await fetch('/api/exclude');
            if (res.ok) {
                const data = await res.json();
                setExcludedList(data);
            }
        } catch (e) {
            console.error('Failed to fetch exclusions', e);
        }
    }, []);

    const addExclusion = async (chatId: string, note: string) => {
        if (!confirm(`Are you sure you want to hide metrics for this chat?\n\nID: ${chatId}`)) return;
        
        // Optimistic UI update
        setPendingMessages(prev => prev.filter(m => m.chatId !== chatId));
        setPerformanceData(prev => prev.filter(m => m.chatId !== chatId));

        try {
            const res = await fetch('/api/exclude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, note })
            });
            if (res.ok) {
                await fetchExcluded();
                fetchData(false); 
            }
        } catch (e) {
            alert('Failed to exclude chat');
        }
    };

    const removeExclusion = async (chatId: string) => {
        if (!confirm(`Restore metrics for this chat?`)) return;
        try {
            const res = await fetch(`/api/exclude?chatId=${chatId}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchExcluded();
                fetchData(false); 
            }
        } catch (e) {
            alert('Failed to restore chat');
        }
    };

    const fetchData = useCallback(async (force = false) => {
        try {
            setStatus('Connecting to API...');
            const API_URL = `/api/performance${force ? '?force=true' : ''}`;
            
            const response = await fetch(API_URL);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch`);
            }

            const data = await response.json();
            
            const processedMetrics: PerformancePair[] = (data.messages || []).map((d: any) => ({ 
                ...d, 
                timestamp: new Date(d.timestamp) 
            }));
            
            setPerformanceData(processedMetrics);
            setPendingMessages(data.pending || []);
            setStatus(`Sync Complete: ${processedMetrics.length} metrics, ${data.pending?.length || 0} pending.`);
        } catch (error: any) {
            console.error('Fetch Error:', error);
            setStatus(`Error: ${error.message}`);
        }
    }, []);
    
    useEffect(() => {
        setIsMounted(true);
        setAnchorDate(dayjs().format('YYYY-MM-DD'));
        fetchData();
        fetchExcluded();
    }, [fetchData, fetchExcluded]);

    const filteredData = useMemo(() => {
        if (!performanceData.length || !anchorDate) return [];

        const endDate = dayjs(anchorDate).endOf('day').toDate();
        const startDate = dayjs(endDate).subtract(currentDuration - 1, 'day').startOf('day').toDate();

        const filtered = performanceData.filter(d => {
            const dTimestamp = dayjs(d.timestamp);
            if (dTimestamp.isBefore(startDate) || dTimestamp.isAfter(endDate)) return false;
            
            if (filterType === 'ALL') return true;
            if (filterType === 'OFFICE' && d.category !== 'OFFICE') return false;
            if (filterType === 'NIGHT' && d.category !== 'WEEKNIGHT') return false;
            if (filterType === 'WEEKEND' && d.category !== 'WEEKEND') return false;
            return true;
        });

        return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [performanceData, anchorDate, currentDuration, filterType]);

    // Calculate Daily Volume for the last 7 days
    const dailyVolume = useMemo(() => {
        if (!anchorDate) return [];
        const days = [];
        for (let i = 0; i < 7; i++) {
            const dateStr = dayjs(anchorDate).subtract(i, 'day').format('YYYY-MM-DD');
            const count = performanceData.filter(d => dayjs(d.timestamp).format('YYYY-MM-DD') === dateStr).length;
            days.push({ date: dayjs(dateStr).format('MM/DD'), count });
        }
        return days;
    }, [performanceData, anchorDate]);

    useEffect(() => {
        if (!anchorDate) return;
        const endDate = dayjs(anchorDate).endOf('day').toDate();
        const startDate = dayjs(endDate).subtract(currentDuration - 1, 'day').startOf('day').toDate();
        updateChart(filteredData, startDate, endDate);
    }, [filteredData, anchorDate, currentDuration]);

    const updateChart = (data: PerformancePair[], startDate: Date, endDate: Date) => {
        if (!chartRef.current) return;
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        renderTimelineChart(ctx, data, startDate, endDate);
    };
    
    const renderTimelineChart = (ctx: CanvasRenderingContext2D, data: PerformancePair[], startDate: Date, endDate: Date) => {
        const chartData = data.map(d => ({
            x: d.timestamp.getTime(),
            y: d.seconds,
            category: d.category,
            contactName: d.contactName,
            body: d.body,
            chatId: d.chatId
        }));

        const colors = data.map(d => {
            if(d.category === 'OFFICE') return '#10b981';
            if(d.category === 'WEEKNIGHT') return '#f59e0b';
            return '#ef4444';
        });

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: { 
                datasets: [{ 
                    label: 'Response Time (Seconds)', 
                    data: chartData, 
                    backgroundColor: colors, 
                    barThickness: data.length > 100 ? 2 : 8,
                    maxBarThickness: 20,
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                onClick: (event, elements, chart) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const item = chart.data.datasets[0].data[index] as any;
                        if (item && item.chatId) {
                            addExclusion(item.chatId, item.contactName || 'Chart Selection');
                        }
                    }
                },
                scales: { 
                    x: { 
                        type: 'time',
                        time: {
                            unit: currentDuration === 1 ? 'hour' : 'day',
                            displayFormats: { hour: 'HH:mm', day: 'MM/dd' },
                            tooltipFormat: 'yyyy/MM/dd HH:mm'
                        },
                        min: startDate.getTime(),
                        max: endDate.getTime(),
                        grid: { display: false }
                    }, 
                    y: { beginAtZero: true, title: { display: true, text: 'Seconds' } } 
                }, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => dayjs((items[0].raw as any).x).format('YYYY/MM/DD HH:mm'),
                            label: (context) => {
                                const d = context.raw as any;
                                const lines = [
                                    `Contact: ${d.contactName || 'Unknown'}`,
                                    `Response: ${formatDuration(d.y)}`, 
                                    `Category: ${d.category}`
                                ];
                                if (d.body) {
                                    lines.push(`Message: ${d.body.substring(0, 50)}${d.body.length > 50 ? '...' : ''}`);
                                }
                                return lines;
                            }
                        }
                    }
                } 
            }
        });
    };

    const getStats = () => {
        if (!anchorDate) return { office: '--', night: '--', weekend: '--' };
        const groups = { OFFICE: [] as number[], WEEKNIGHT: [] as number[], WEEKEND: [] as number[] };
        filteredData.forEach(d => groups[d.category].push(d.seconds));
        const fmt = (arr: number[]) => arr.length ? formatDuration(arr.reduce((a,b)=>a+b,0)/arr.length) : '--';
        return { office: fmt(groups.OFFICE), night: fmt(groups.WEEKNIGHT), weekend: fmt(groups.WEEKEND) };
    };

    if (!isMounted) return null;
    const stats = getStats();
    const cardDimmed = (cardType: string) => filterType !== 'ALL' && filterType !== cardType ? 'opacity-40 grayscale-[80%]' : '';

    return (
      <div className='bg-gray-100 text-gray-800 p-5 min-h-screen font-sans'>
          <div className='max-w-7xl mx-auto'>
              {/* Header & Settings */}
              <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
                  <div className='flex justify-between items-center flex-wrap gap-4 mb-5'>
                      <div>
                          <h2 className='text-2xl font-bold text-gray-900'>客服績效分析 (Analytics)</h2>
                          <div className='text-sm text-gray-500 font-mono'>
                              {anchorDate ? `${dayjs(anchorDate).subtract(currentDuration - 1, 'day').format('YYYY/MM/DD')} - ${dayjs(anchorDate).format('YYYY/MM/DD')}` : 'Loading...'}
                              <span className='ml-4 text-blue-600 font-bold'>{status}</span>
                          </div>
                      </div>
                      
                      <div className='flex items-center gap-4 bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex-wrap'>
                           <div className='flex items-center gap-2 border-r border-gray-300 pr-4'>
                              <span className='text-sm text-gray-600 font-medium'>基準日:</span>
                              <input type='date' value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className='p-1.5 border border-gray-300 rounded-md bg-white text-sm'/>
                          </div>
                          
                          <div className='flex items-center gap-2 border-r border-gray-300 pr-4'>
                              {[1, 3, 7].map(days => (
                                  <button key={days} onClick={() => setCurrentDuration(days)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${currentDuration === days ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}>
                                      {days}D
                                  </button>
                              ))}
                          </div>

                          <div className='flex items-center gap-2'>
                              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className='p-1.5 border border-gray-300 rounded-md bg-white text-sm'>
                                  <option value='ALL'>全部 (All)</option>
                                  <option value='OFFICE'>平日上班 (Office)</option>
                                  <option value='NIGHT'>平日晚上 (Night)</option>
                                  <option value='WEEKEND'>週末 (Weekend)</option>
                              </select>
                          </div>
                          
                          <button onClick={() => fetchData(true)} className='px-3 py-1.5 rounded-md text-blue-600 font-bold hover:bg-blue-50 transition-colors'>🔄 Sync</button>
                          
                          <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`px-3 py-1.5 rounded-md font-medium border transition-colors ${showSettings ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                          >
                              ⚙️ Filter
                          </button>
                      </div>
                  </div>

                  {/* Settings Panel */}
                  {showSettings && (
                      <div className='mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in'>
                          <h3 className='text-lg font-bold text-gray-900 mb-3'>Excluded Chats (Hidden)</h3>
                          <div className='text-sm text-gray-500 mb-4'>
                              These chats are hidden from performance metrics and pending lists.
                          </div>
                          {excludedList.length > 0 ? (
                              <div className='flex flex-wrap gap-2'>
                                  {excludedList.map(chat => (
                                      <div key={chat.chat_id} className='flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-300 shadow-sm'>
                                          <span className='text-sm font-mono text-gray-700'>{chat.note || chat.chat_id}</span>
                                          <button 
                                              onClick={() => removeExclusion(chat.chat_id)}
                                              className='text-gray-400 hover:text-red-500 font-bold'
                                              title="Restore"
                                          >
                                              ×
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className='text-sm text-gray-400 italic'>No chats excluded yet. Use the "Hide" button in the tables below.</div>
                          )}
                      </div>
                  )}

                  {/* Stats Cards Row 1: Averages */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-5 mb-6'>
                      <div className={`p-5 rounded-lg border-l-4 border-green-500 bg-white border shadow-sm transition-all ${cardDimmed('OFFICE')}`}>
                          <div className='text-xs text-gray-500 uppercase font-bold tracking-wider'>Office Hours Avg (9:30-18:30)</div>
                          <div className='text-3xl font-black text-gray-900 mt-1'>{stats.office}</div>
                      </div>
                      <div className={`p-5 rounded-lg border-l-4 border-amber-500 bg-white border shadow-sm transition-all ${cardDimmed('NIGHT')}`}>
                          <div className='text-xs text-gray-500 uppercase font-bold tracking-wider'>Weeknights Avg</div>
                          <div className='text-3xl font-black text-gray-900 mt-1'>{stats.night}</div>
                      </div>
                      <div className={`p-5 rounded-lg border-l-4 border-red-500 bg-white border shadow-sm transition-all ${cardDimmed('WEEKEND')}`}>
                          <div className='text-xs text-gray-500 uppercase font-bold tracking-wider'>Weekends Avg</div>
                          <div className='text-3xl font-black text-gray-900 mt-1'>{stats.weekend}</div>
                      </div>
                  </div>

                  {/* Daily Volume Bar */}
                  <div className='mb-8'>
                      <div className='text-xs text-gray-400 uppercase font-bold tracking-widest mb-3 flex items-center gap-2'>
                          <span className='w-2 h-2 rounded-full bg-blue-500'></span>
                          Daily Message Volume (Last 7 Days)
                      </div>
                      <div className='grid grid-cols-7 gap-3'>
                          {dailyVolume.map((day, idx) => (
                              <div key={idx} className='bg-gray-50 border border-gray-200 rounded-lg p-3 text-center'>
                                  <div className='text-[10px] text-gray-400 font-bold uppercase'>{day.date}</div>
                                  <div className='text-xl font-black text-blue-600'>{day.count}</div>
                                  <div className='text-[8px] text-gray-400 uppercase'>replies</div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className='relative h-[400px] w-full mb-10'>
                      <canvas ref={chartRef}></canvas>
                  </div>

                  {/* Performance Log Table */}
                  <div className='mt-8 mb-10'>
                      <div className='flex items-center justify-between mb-4'>
                           <h3 className='text-xl font-bold text-gray-900'>📊 Detailed History</h3>
                           <span className='text-xs text-gray-500'>{filteredData.length} records</span>
                      </div>
                      <div className='bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto'>
                          <table className='w-full text-left border-collapse text-sm'>
                              <thead className='bg-gray-50 border-b border-gray-200 sticky top-0 shadow-sm'>
                                  <tr>
                                      <th className='px-4 py-3 font-semibold text-gray-600'>Time (Inbound)</th>
                                      <th className='px-4 py-3 font-semibold text-gray-600'>Contact / Group</th>
                                      <th className='px-4 py-3 font-semibold text-gray-600'>Response Time</th>
                                      <th className='px-4 py-3 font-semibold text-gray-600'>Category</th>
                                      <th className='px-4 py-3 font-semibold text-gray-600'>Message</th>
                                      <th className='px-4 py-3 font-semibold text-gray-600 text-center'>Action</th>
                                  </tr>
                              </thead>
                              <tbody className='divide-y divide-gray-100'>
                                  {filteredData.map((d, i) => (
                                      <tr key={i} className='hover:bg-gray-50 transition-colors'>
                                          <td className='px-4 py-3 text-gray-500 whitespace-nowrap'>
                                              {dayjs(d.timestamp).format('MM/DD HH:mm')}
                                          </td>
                                          <td className='px-4 py-3 font-medium text-gray-900'>
                                              {d.contactName || 'Unknown'}
                                              <div className='text-[10px] text-gray-400 font-mono'>{d.chatId}</div>
                                          </td>
                                          <td className='px-4 py-3 font-mono text-gray-700'>
                                              {formatDuration(d.seconds)}
                                          </td>
                                          <td className='px-4 py-3'>
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                  d.category === 'OFFICE' ? 'bg-green-50 text-green-600 border-green-200' :
                                                  d.category === 'WEEKNIGHT' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                  'bg-red-50 text-red-600 border-red-200'
                                              }`}>
                                                  {d.category}
                                              </span>
                                          </td>
                                          <td className='px-4 py-3 text-gray-500 max-w-xs truncate' title={d.body}>
                                              {d.body || '(No content)'}
                                          </td>
                                          <td className='px-4 py-3 text-center'>
                                              <button 
                                                onClick={() => addExclusion(d.chatId, d.contactName || 'History List')}
                                                className='text-xs text-gray-400 hover:text-red-600 font-medium hover:underline'
                                              >
                                                  🚫 Hide
                                              </button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* Pending Messages Section */}
                  <div className='mt-10 border-t pt-8'>
                      <div className='flex items-center justify-between mb-6'>
                          <h3 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
                              <span className='flex h-3 w-3 rounded-full bg-red-500 animate-pulse'></span>
                              待回覆訊息 (Pending Replies)
                              <span className='ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs'>{pendingMessages.length}</span>
                          </h3>
                      </div>

                      {pendingMessages.length > 0 ? (
                          <div className='overflow-hidden rounded-xl border border-gray-200 shadow-sm'>
                              <table className='w-full text-left border-collapse bg-white'>
                                  <thead className='bg-gray-50 border-b border-gray-200'>
                                      <tr>
                                          <th className='px-6 py-3 text-xs font-bold text-gray-500 uppercase'>聯絡人 / 群組 (Contact)</th>
                                          <th className='px-6 py-3 text-xs font-bold text-gray-500 uppercase'>最後訊息 (Message)</th>
                                          <th className='px-6 py-3 text-xs font-bold text-gray-500 uppercase'>收到時間 (Received)</th>
                                          <th className='px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right'>已等待 (Waiting)</th>
                                          <th className='px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center'>操作</th>
                                      </tr>
                                  </thead>
                                  <tbody className='divide-y divide-gray-100'>
                                      {pendingMessages.map((msg) => (
                                          <tr key={msg.messageId} className='hover:bg-gray-50 transition-colors'>
                                              <td className='px-6 py-4'>
                                                  <div className='flex items-center gap-2'>
                                                      <span className='font-bold text-gray-900'>{msg.contactName}</span>
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                          msg.chatId.includes('@g.us') 
                                                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                                          : 'bg-gray-50 text-gray-500 border-gray-200'
                                                      }`}>
                                                          {msg.chatId.includes('@g.us') ? 'GROUP' : 'DM'}
                                                      </span>
                                                  </div>
                                                  <div className='text-xs text-gray-400 font-mono mt-0.5'>{msg.chatId}</div>
                                              </td>
                                              <td className='px-6 py-4'>
                                                  <div className='text-sm text-gray-600 line-clamp-2 max-w-md'>{msg.body}</div>
                                              </td>
                                              <td className='px-6 py-4 text-sm text-gray-500'>
                                                  {dayjs(msg.timestamp).format('MM/DD HH:mm')}
                                              </td>
                                              <td className='px-6 py-4 text-right'>
                                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                                      (now - msg.timestamp) > 3600000 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                  }`}>
                                                      {formatDuration(Math.floor((now - msg.timestamp) / 1000))}
                                                  </span>
                                              </td>
                                              <td className='px-6 py-4 text-center'>
                                                  <button 
                                                    onClick={() => addExclusion(msg.chatId, msg.contactName)}
                                                    className='text-xs text-gray-400 hover:text-red-600 hover:underline'
                                                    title="Exclude this chat from metrics"
                                                  >
                                                      🚫 Hide
                                                  </button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      ) : (
                          <div className='bg-gray-50 rounded-xl p-10 text-center border-2 border-dashed border-gray-200'>
                              <div className='text-4xl mb-3'>🎉</div>
                              <p className='text-gray-500 font-medium'>所有訊息皆已回覆！</p>
                              <p className='text-xs text-gray-400 mt-1'>太棒了，目前沒有任何待處理的對話。</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    );
}
