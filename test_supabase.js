const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        // Remover aspas extras se houver
        value = value.replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConn() {
    console.log("--- Testando Conexão Supabase ---");
    try {
        const { data, error } = await supabase.from('usuarios').select('nome, telefone').limit(5);
        if (error) {
            console.error("❌ Erro:", error.message);
        } else {
            console.log("✅ Conexão OK!");
            console.log("Amostra:", data);
        }
    } catch (e) {
        console.error("❌ Erro Inesperado:", e.message);
    }
}

testConn();
