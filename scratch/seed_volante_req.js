const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedReq() {
  console.log("Iniciando seed de requisição de volante...");
  const { data, error } = await supabase.from('requisicoes_volantes').insert([
    {
      unidade_destino: 'UNIDADE TESTE ANTIGRAVITY',
      data_inicio: new Date().toISOString().split('T')[0],
      quantidade_necessaria: 1,
      motivo: 'Teste de integração do módulo RH - Cobertura de falta',
      status: 'PENDENTE',
      prioridade: 'URGENTE'
    }
  ]);

  if (error) {
    console.error("Erro ao inserir:", error);
  } else {
    console.log("Sucesso! Requisição de teste criada.");
  }
}

seedReq();
