const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        value = value.replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkInsalubridade() {
    try {
        const { data, error } = await supabase.from('usuarios').select('nome, insalubridade, percentual_insalubridade').limit(10);
        if (error) {
            console.error("❌ Erro:", error.message);
            // Se der erro, tenta um por um para ver qual falha
            const res1 = await supabase.from('usuarios').select('insalubridade').limit(1);
            console.log("Coluna 'insalubridade' existe?", !res1.error);
            const res2 = await supabase.from('usuarios').select('percentual_insalubridade').limit(1);
            console.log("Coluna 'percentual_insalubridade' existe?", !res2.error);
        } else {
            console.log("✅ Dados encontrados:", data);
        }
    } catch (e) {
        console.error("❌ Exceção:", e.message);
    }
}

checkInsalubridade();
