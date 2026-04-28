-- =================================================================================
-- CRIAÇÃO DA TABELA DE CANDIDATOS (TRIAGEM RH)
-- Execute este comando no SQL Editor do seu Supabase
-- =================================================================================

CREATE TABLE IF NOT EXISTS candidatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    pis TEXT,
    titulo_eleitor TEXT,
    telefone TEXT NOT NULL,
    email TEXT,
    data_nascimento DATE,
    cargo_pretendido TEXT,
    
    -- Endereço Completo
    cep TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'Manaus',
    estado TEXT DEFAULT 'AM',
    
    -- Uniforme e SST
    tamanho_camisa TEXT, 
    tamanho_calca TEXT, 
    tamanho_calcado INTEGER, 
    
    -- Perfil Profissional
    experiencia_previa BOOLEAN DEFAULT FALSE,
    ultimo_emprego TEXT,
    escolaridade TEXT, 
    
    -- Status da Triagem
    status_candidato TEXT DEFAULT 'NOVO', 
    observacoes_rh TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS candidatos_cpf_idx ON candidatos(cpf);
CREATE INDEX IF NOT EXISTS candidatos_status_idx ON candidatos(status_candidato);
