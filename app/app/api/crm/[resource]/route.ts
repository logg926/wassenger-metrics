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

    let query: any;
    
    // Handle specific resource logic (e.g., joins)
    if (resource === 'department') {
        // Join with school table to get school_name
        query = supabaseAdmin.from(resource).select('*, school:school_id(school_name)', { count: 'exact' });
    } else if (resource === 'crm_contacts') {
        // Join with school table to get school_name
        query = supabaseAdmin.from(resource).select('*, school:school_id(school_name)', { count: 'exact' });
    } else if (resource === 'school') {
        // Join with department and crm_contacts
        query = supabaseAdmin.from(resource).select('*, department(group_name), crm_contacts(name, phone)', { count: 'exact' });
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

    // Handle Global Search (q)
    const q = searchParams.get('q');
    if (q) {
        if (resource === 'school') {
            query = query.or(`school_name.ilike.%${q}%,school_short_id.ilike.%${q}%`);
        } else if (resource === 'department') {
             query = query.or(`department_type.ilike.%${q}%,group_name.ilike.%${q}%`);
        }
    }

    // Handle Generic Filters
    // Iterate all params and filter out special ones
    const reservedParams = ['_start', '_end', '_sort', '_order', 'q', 'id'];
    searchParams.forEach((value, key) => {
        if (!reservedParams.includes(key) && value) {
             // Basic equality filter. 
             // Ideally we could support operators like state_neq, amount_gt etc if we parse keys
             // For now, strict equality is enough for filtering by state/category
             query = query.eq(key, value);
        }
    });
    
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

    if (resource === 'school' && data) {
        // Initialize teachers array for all schools
        data.forEach((school: any) => {
            school.teachers = [];
        });

        // Collect school IDs
        const schoolIds = data.map((d: any) => d.school_id);
        
        if (schoolIds.length > 0) {
            // Fetch teacher_school links
            const { data: teacherSchools, error: tsError } = await supabaseAdmin
                .from('teacher_school')
                .select('user_id, school_id, is_admin')
                .in('school_id', schoolIds);
            
            if (!tsError && teacherSchools && teacherSchools.length > 0) {
                const userIds = teacherSchools.map((ts: any) => ts.user_id);
                
                if (userIds.length > 0) {
                    // Fetch user details manually because of missing direct FKs between teacher_school and others
                    const [profilesRes, contactsRes, rolesRes] = await Promise.all([
                        supabaseAdmin.from('user_profiles').select('id, email').in('id', userIds),
                        supabaseAdmin.from('teacher_contact').select('teacher_id, contact_number').in('teacher_id', userIds),
                        supabaseAdmin.from('role').select('user_id, name').in('user_id', userIds)
                    ]);
                    
                    const profilesMap = new Map(profilesRes.data?.map((p: any) => [p.id, p]) || []);
                    const contactsMap = new Map(contactsRes.data?.map((c: any) => [c.teacher_id, c]) || []);
                    const rolesMap = new Map(rolesRes.data?.map((r: any) => [r.user_id, r]) || []);

                    // Map back to schools
                    const schoolTeachersMap = new Map();
                    teacherSchools.forEach((ts: any) => {
                        if (!schoolTeachersMap.has(ts.school_id)) {
                            schoolTeachersMap.set(ts.school_id, []);
                        }
                        const profile = profilesMap.get(ts.user_id);
                        const contact = contactsMap.get(ts.user_id);
                        const role = rolesMap.get(ts.user_id);
                        
                        schoolTeachersMap.get(ts.school_id).push({
                            user_id: ts.user_id,
                            is_admin: ts.is_admin,
                            email: profile?.email || 'Unknown',
                            phone: contact?.contact_number || '',
                            name: role?.name || 'Unknown'
                        });
                    });

                    // Attach to data
                    data.forEach((school: any) => {
                        if (schoolTeachersMap.has(school.school_id)) {
                            school.teachers = schoolTeachersMap.get(school.school_id);
                        }
                    });
                }
            }
        }
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
