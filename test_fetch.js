const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/['"]/g, '');
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim().replace(/['"]/g, '');
fetch(url + '/rest/v1/usuarios?select=nome,unidade_alocacao,cargo', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
}).then(r => r.json()).then(data => {
    const units = Array.from(new Set(data.map(u => u.unidade_alocacao))).filter(u => u && u.toUpperCase().includes('CLARION'));
    console.log("Units in DB:", units);
    const relatedUsers = data.filter(u => u.unidade_alocacao && u.unidade_alocacao.toUpperCase().includes('CLARION'));
    console.log("Users:", relatedUsers.map(u => u.unidade_alocacao + ' - ' + u.cargo));
});
