const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("Checking users...");
    const { data: users, error } = await supabase.from('users').select('id, role, email');
    if (error) {
        console.error("Users Error:", error);
    } else {
        console.log("Users Found:", users.length);
        console.log("Roles Sample:", users.slice(0, 5).map(u => u.role));
    }

    console.log("Checking TSR...");
    const { count: tsrCount } = await supabase.from('term_subject_results').select('*', { count: 'exact', head: true });
    console.log("Total Finalized Marks:", tsrCount);
}

check();
