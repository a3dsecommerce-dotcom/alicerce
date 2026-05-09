-- Tabela de Quadro de Lotação (Budget de Vagas por Unidade)
CREATE TABLE IF NOT EXISTS vagas_quadro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_nome TEXT NOT NULL,
    secretaria TEXT NOT NULL,
    cargo TEXT NOT NULL,
    vagas_totais INTEGER DEFAULT 1,
    turno TEXT, -- DIURNO, NOTURNO, 12X36, 44H
    horario TEXT,
    insalubridade BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE vagas_quadro ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificado para o ERP)
DROP POLICY IF EXISTS "Acesso total ao quadro de vagas" ON vagas_quadro;
CREATE POLICY "Acesso total ao quadro de vagas" ON vagas_quadro FOR ALL USING (true) WITH CHECK (true);

-- Comentários
COMMENT ON TABLE vagas_quadro IS 'Define o limite máximo de contratação por unidade e cargo';
