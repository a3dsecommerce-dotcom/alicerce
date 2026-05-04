
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://db.alicerce.cloud";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data: users, error: e1 } = await supabase.from('usuarios').select('nome, função, role').limit(5);
  const { data: suprimentos, error: e2 } = await supabase.from('almox_suprimentos').select('*').limit(5);
  const { data: reqs, error: e3 } = await supabase.from('requisicoes').select('*').limit(5);

  console.log('Users Sample:', users);
  console.log('Suprimentos Sample:', suprimentos);
  console.log('Requisicoes Sample:', reqs);
  
  if (e1) console.error('E1:', e1);
  if (e2) console.error('E2:', e2);
  if (e3) console.error('E3:', e3);
}

checkTables();
