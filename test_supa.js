const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/['"]/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/['"]/g, '');

const s = createClient(url, key);

async function check() {
    const { data, error } = await s.from('usuarios').select('nome, unidade_alocacao, cargo, insalubridade, percentual_insalubridade, status').eq('status', 'ATIVO');
    if (error) { console.error(error); return; }
    
    console.log("Total Ativos:", data.length);
    const clarion = data.filter(u => u.unidade_alocacao && u.unidade_alocacao.toUpperCase().includes('CLARION'));
    console.log("Usuarios Clarionicio:");
    clarion.forEach(u => console.log(u.nome, "|", u.unidade_alocacao, "|", u.cargo, "|", u.insalubridade, "|", u.percentual_insalubridade));
}
check();
