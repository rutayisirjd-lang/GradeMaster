const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
    console.log("Checking class_subjects data...");
    const { data, error } = await supabase.from('class_subjects').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
    }

    console.log("Checking users data...");
    const { data: users, error: uError } = await supabase.from('users').select('*').limit(1);
    if (uError) {
        console.error("Error:", uError);
    } else {
        console.log("User:", users);
    }
}

checkSchema();
