-- TABELA DE QUADRO DE VAGAS (RH)
CREATE TABLE IF NOT EXISTS vagas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade TEXT NOT NULL,
    cargo TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    status TEXT DEFAULT 'ABERTA', -- ABERTA, FECHADA, PAUSADA
    requisitos TEXT,
    remuneracao DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Ver vagas" ON vagas FOR SELECT USING (true);
CREATE POLICY "Gerenciar vagas" ON vagas FOR ALL USING (true);
