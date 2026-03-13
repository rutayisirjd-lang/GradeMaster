import { createAdminClient } from './src/lib/supabase/admin.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function diagnose() {
    console.log("🔍 DIAGNOSTIC START");
    const admin = createAdminClient();

    // 1. Check Academic Years
    const { data: years, error: yErr } = await admin.from('academic_years').select('*');
    console.log("\n📅 Academic Years:", years?.length || 0, "found");
    if (years) console.table(years);
    if (yErr) console.error("❌ Year Error:", yErr.message);

    // 2. Check Classes
    const { data: classes, error: cErr } = await admin.from('classes').select('*, academic_years(label)');
    console.log("\n🏛️ Classes:", classes?.length || 0, "found");
    if (classes && classes.length > 0) console.table(classes.map(c => ({
        id: c.id,
        name: c.name,
        year: (c as any).academic_years?.label
    })));
    if (cErr) console.error("❌ Class Error:", cErr.message);

    // 3. Check Director Role
    const { data: users, error: uErr } = await admin.from('users').select('*').eq('email', 'director@grademaster.rw');
    console.log("\n👤 Director User Record:", users?.length || 0);
    if (users) console.table(users);
    if (uErr) console.error("❌ User Error:", uErr.message);

    console.log("\n🔍 DIAGNOSTIC END");
}

diagnose();
