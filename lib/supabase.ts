import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== "") 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : "https://db.alicerce.cloud";

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== "")
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.");
}

const mockSupabase = {
  from: () => ({
    select: () => ({ order: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase não inicializado" } }) }), limit: () => Promise.resolve({ data: [], error: null }) }), limit: () => Promise.resolve({ data: [], error: null }) }),
    insert: () => Promise.resolve({ data: null, error: { message: "Supabase não inicializado" } }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: "Supabase não inicializado" } }) }),
    upsert: () => Promise.resolve({ data: null, error: { message: "Supabase não inicializado" } }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: "Supabase não inicializado" } }) }),
    on: () => ({ subscribe: () => {} }),
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase as any;
