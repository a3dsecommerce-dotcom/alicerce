import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- CHECK UNIDADES ---');
  const { data: units, error } = await supabase.from('unidades').select('id, nome, rota, encarregado_id, encarregado_nome');
  if (error) console.error(error);
  console.table(units);

  console.log('--- CHECK CONFIG_ROTAS ---');
  const { data: configs } = await supabase.from('config_rotas').select('*');
  console.table(configs);

  console.log('--- CHECK USUARIOS (Encarregados) ---');
  const { data: users } = await supabase.from('usuarios').select('id, nome, email').ilike('cargo', '%encarregado%');
  console.table(users);
}

check();
