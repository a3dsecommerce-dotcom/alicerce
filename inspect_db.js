const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'http://localhost:8000';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("--- UNIDADES ---");
    const { data: unidades, error: uError } = await supabase.from('unidades').select('*').limit(1);
    if (uError) console.error("Unidades Error:", uError);
    console.log(JSON.stringify(unidades, null, 2));

    console.log("\n--- USUARIOS ---");
    const { data: usuarios, error: usError } = await supabase.from('usuarios').select('*').limit(1);
    if (usError) console.error("Usuarios Error:", usError);
    console.log(JSON.stringify(usuarios, null, 2));
}

inspect();
