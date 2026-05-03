
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://db.alicerce.cloud';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);


async function checkSchema() {
  const { data, error } = await supabase
    .from('requisicoes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching requisicoes:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns in requisicoes:', Object.keys(data[0]));
  } else {
    console.log('No data in requisicoes to check schema.');
  }
}

checkSchema();
