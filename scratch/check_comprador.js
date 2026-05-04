
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://db.alicerce.cloud";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: users, error } = await supabase
    .from('usuarios')
    .select('nome, email, role, nivel')
    .ilike('role', '%COMPRA%');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Users with COMPRA in role:');
  console.table(users);
}

checkUser();
