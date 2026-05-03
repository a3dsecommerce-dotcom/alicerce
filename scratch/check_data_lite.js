const supabaseUrl = 'https://db.alicerce.cloud';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

async function check() {
  const query = async (table, select = '*') => {
    const url = `${supabaseUrl}/rest/v1/${table}?select=${select}`;
    console.log('Querying:', url);
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    return res.json();
  };

  try {
    console.log('--- UNIDADES ---');
    const units = await query('unidades', 'id,nome,rota,encarregado_id,encarregado_nome');
    console.table(units);

    console.log('--- CONFIG_ROTAS ---');
    const configs = await query('config_rotas');
    console.table(configs);

    console.log('--- USUARIOS (Encarregados) ---');
    const users = await query('usuarios', 'id,nome,cargo,nivel_acesso');
    const filtered = (users || []).filter(u => u.cargo?.toLowerCase().includes('encarregado'));
    console.table(filtered);
  } catch (e) {
    console.error(e);
  }
}

check();
