
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://db.alicerce.cloud";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function countUsers() {
  const { count, error } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error counting users:', error);
    return;
  }

  console.log('Total users in database:', count);
}

countUsers();
