const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJoin() {
    console.log("Testing inverse join: class_subjects -> users");
    const { data, error } = await supabase
        .from('class_subjects')
        .select(`
            *,
            users (
                *
            )
        `)
        .limit(1);
    
    if (error) {
        console.error("Inverse Join Error:", error.message);
    } else {
        console.log("Inverse Join Success:", JSON.stringify(data, null, 2));
    }

    console.log("Testing explicit inverse join: class_subjects -> users(teacher_id)");
    const { data: data2, error: error2 } = await supabase
        .from('class_subjects')
        .select(`
            *,
            users!teacher_id (
                *
            )
        `)
        .limit(1);

    if (error2) {
        console.error("Explicit Inverse Join Error:", error2.message);
    } else {
        console.log("Explicit Inverse Join Success:", JSON.stringify(data2, null, 2));
    }
}

checkJoin();
