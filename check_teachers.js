import { createAdminClient } from './src/lib/supabase/admin.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTeachers() {
    const admin = createAdminClient();
    const { data, error } = await admin.from('users').select('id, first_name, last_name, is_active').neq('role', 'director');
    console.log("Teachers:", data, error);
}

checkTeachers();
