const { Pool } = require('pg');
require('dotenv').config({ path: 'app/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createView() {
  const client = await pool.connect();
  try {
    console.log("Creating view school_details...");
    await client.query(`
      CREATE OR REPLACE VIEW public.school_details AS
      SELECT
        s.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'group_name', d.group_name,
              'department_type', d.department_type
            ))
            FROM public.department d
            WHERE d.school_id = s.school_id
          ),
          '[]'::json
        ) as departments_json,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'name', c.name,
              'phone', c.phone,
              'role', c.role
            ))
            FROM public.crm_contacts c
            WHERE c.school_id = s.school_id
          ),
          '[]'::json
        ) as contacts_json,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'email', up.email,
              'phone', tc.contact_number,
              'name', COALESCE(r.name, 'Unknown'),
              'is_admin', ts.is_admin,
              'user_id', ts.user_id
            ))
            FROM public.teacher_school ts
            LEFT JOIN public.user_profiles up ON ts.user_id = up.id
            LEFT JOIN public.teacher_contact tc ON ts.user_id = tc.teacher_id
            LEFT JOIN public.role r ON ts.user_id = r.user_id
            WHERE ts.school_id = s.school_id
          ),
          '[]'::json
        ) as teachers_json
      FROM public.school s;
    `);
    console.log("View created successfully.");
  } catch (e) {
    console.error("Error creating view:", e);
  } finally {
    client.release();
    pool.end();
  }
}

createView();
