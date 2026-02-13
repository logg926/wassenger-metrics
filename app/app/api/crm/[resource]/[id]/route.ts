import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  try {
    const { resource, id } = await params;
    
    // Map resource to PK
    const pk = resource === 'school' ? 'school_id' : 'id';
    
    const { data, error } = await supabaseAdmin
      .from(resource)
      .select('*')
      .eq(pk, id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  try {
    const { resource, id } = await params;
    const body = await request.json();
    
    // Map resource to PK
    const pk = resource === 'school' ? 'school_id' : 'id';

    const { data, error } = await supabaseAdmin
      .from(resource)
      .update(body)
      .eq(pk, id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  try {
    const { resource, id } = await params;
    
    // Map resource to PK
    const pk = resource === 'school' ? 'school_id' : 'id';

    const { error } = await supabaseAdmin
      .from(resource)
      .delete()
      .eq(pk, id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
