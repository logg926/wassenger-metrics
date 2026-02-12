import { NextResponse } from 'next/server';
import pool, { initDb } from '../performance/db';

export async function GET() {
    try {
        await initDb();
        const result = await pool.query('SELECT chat_id, note, created_at FROM excluded_chats ORDER BY created_at DESC');
        return NextResponse.json(result.rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await initDb();
        const { chatId, note } = await request.json();
        
        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
        }

        await pool.query(
            'INSERT INTO excluded_chats (chat_id, note) VALUES ($1, $2) ON CONFLICT (chat_id) DO UPDATE SET note = $2',
            [chatId, note || '']
        );
        
        return NextResponse.json({ success: true, message: `Excluded ${chatId}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await initDb();
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
        }

        await pool.query('DELETE FROM excluded_chats WHERE chat_id = $1', [chatId]);
        
        return NextResponse.json({ success: true, message: `Removed ${chatId} from exclusion list` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
