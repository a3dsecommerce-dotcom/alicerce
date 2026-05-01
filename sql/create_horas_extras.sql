-- TABELA DE HORAS EXTRAS
CREATE TABLE IF NOT EXISTS horas_extras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    unidade_alocacao TEXT, -- Unidade onde a extra foi realizada
    data_referencia DATE DEFAULT CURRENT_DATE,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    total_horas TEXT, -- Ex: "02:30"
    motivo TEXT,
    aprovado_por UUID REFERENCES usuarios(id), -- Quem autorizou no campo (Encarregado)
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, REVISADO, PROCESSADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE horas_extras ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Simples para o protótipo)
CREATE POLICY "Ver horas extras" ON horas_extras FOR SELECT USING (true);
CREATE POLICY "Inserir horas extras" ON horas_extras FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar horas extras" ON horas_extras FOR UPDATE USING (true);
