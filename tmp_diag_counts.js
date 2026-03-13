const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const tables = ['users', 'students', 'classes', 'subjects', 'class_subjects', 'assessments', 'marks', 'term_subject_results', 'term_results'];
    const counts = {};
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        counts[table] = error ? error.message : count;
    }
    console.log(JSON.stringify(counts, null, 2));
}

checkData();
