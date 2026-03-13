const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envFile = fs.readFileSync('.env.local');
const env = dotenv.parse(envFile);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJoin() {
    console.log("Testing join: users -> class_subjects");
    const { data, error } = await supabase
        .from('users')
        .select(`
            id,
            class_subjects (
                id
            )
        `)
        .limit(1);
    
    if (error) {
        console.error("Join Error:", error.message);
    } else {
        console.log("Join Success:", JSON.stringify(data, null, 2));
    }

    console.log("Testing explicit join: users -> class_subjects(teacher_id)");
    const { data: data2, error: error2 } = await supabase
        .from('users')
        .select(`
            id,
            class_subjects!teacher_id (
                id
            )
        `)
        .limit(1);

    if (error2) {
        console.error("Explicit Join Error:", error2.message);
    } else {
        console.log("Explicit Join Success:", JSON.stringify(data2, null, 2));
    }
}

checkJoin();
