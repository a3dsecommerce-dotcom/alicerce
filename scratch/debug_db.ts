
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const phone = '92994441010'; // Example
  const { data: units } = await supabase.from('unidades').select('*').or(`telefone.ilike.%${phone}%,responsavel_telefone.ilike.%${phone}%`);
  console.log("UNIDADES ENCONTRADAS:", units);
  
  const { data: users } = await supabase.from('usuarios').select('*').limit(5);
  console.log("EXEMPLO USUARIOS:", users);
}

debug();
