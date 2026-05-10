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

async function findUser() {
    try {
        const { data, error } = await supabase.from('usuarios').select('*').ilike('nome', '%Diogo%');
        if (error) {
            console.error("❌ Erro:", error.message);
        } else {
            console.log("✅ Usuários encontrados:", data);
        }
    } catch (e) {
        console.error("❌ Exceção:", e.message);
    }
}

findUser();
