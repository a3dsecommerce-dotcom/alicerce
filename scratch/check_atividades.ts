// Script para verificar a tabela atividades
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAtividades() {
  const { data, error, count } = await supabase
    .from('atividades')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('Erro ao ler atividades:', error);
  } else {
    console.log('Total de registros:', count);
    console.log('Últimos registros:', JSON.stringify(data, null, 2));
  }
}

checkAtividades();
