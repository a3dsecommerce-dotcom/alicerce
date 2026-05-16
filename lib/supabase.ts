import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
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
