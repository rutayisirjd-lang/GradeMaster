const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

// USE ANON KEY TO TEST RLS
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log("Testing as GUEST (Anon Key)...");
    const { data: users, error } = await supabase.from('users').select('id, role');
    if (error) {
        console.log("Anon Access Denied:", error.message);
    } else {
        console.log("Anon Access allowed, found users:", users.length);
    }
}

check();
