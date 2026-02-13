import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    const { resource } = await params;
    const { searchParams } = new URL(request.url);

    // Basic Validation
    if (!resource) return NextResponse.json({ error: "Resource required" }, { status: 400 });

    let query;
    
    // Handle specific resource logic (e.g., joins)
    if (resource === 'department') {
        // Join with school table to get school_name
        query = supabaseAdmin.from(resource).select('*, school:school_id(school_name)', { count: 'exact' });
    } else if (resource === 'school') {
        // Join with department table to get related groups
        query = supabaseAdmin.from(resource).select('*, department(group_name)', { count: 'exact' });
    } else {
        query = supabaseAdmin.from(resource).select('*', { count: 'exact' });
    }

    // Handle Pagination: _start, _end
    const _start = searchParams.get('_start');
    const _end = searchParams.get('_end');
    if (_start && _end) {
      query = query.range(parseInt(_start), parseInt(_end) - 1);
    }

    // Handle Sorting: _sort, _order
    const _sort = searchParams.get('_sort');
    const _order = searchParams.get('_order');
    if (_sort) {
      query = query.order(_sort, { ascending: _order === 'ASC' });
    }
    
    // Handle ID filtering for "many" requests (e.g. relation fetches)
    // Refine sends ?id=1&id=2 for multiple IDs
    const ids = searchParams.getAll('id');
    if (ids.length > 0) {
        // Assume Primary Key is 'id' or 'school_id' based on resource
        const pk = resource === 'school' ? 'school_id' : 'id';
        query = query.in(pk, ids);
    }
    
    // Execute
    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Response format expected by simple-rest: header x-total-count
    const response = NextResponse.json(data);
    if (count !== null) {
        response.headers.set('x-total-count', count.toString());
        // For CORS (if needed, though same origin usually fine)
        response.headers.set('Access-Control-Expose-Headers', 'x-total-count');
    }
    
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  try {
    const { resource } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from(resource)
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
