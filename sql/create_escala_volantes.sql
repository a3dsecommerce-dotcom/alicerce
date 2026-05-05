-- Tabela para Registro de Escala de Volantes (Histórico Diário)
CREATE TABLE IF NOT EXISTS escala_volantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES usuarios(id),
    colaborador_nome TEXT NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Array de objetos: { unidade: string, entrada: string, saida: string, motivo: string }
    detalhes_visitas JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    observacoes TEXT,
    criado_por_id UUID REFERENCES usuarios(id),
    criado_por_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_escala_volantes_data ON escala_volantes(data);
CREATE INDEX IF NOT EXISTS idx_escala_volantes_colab ON escala_volantes(colaborador_id);

-- Habilitar RLS
ALTER TABLE escala_volantes ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Ver escala_volantes" ON escala_volantes FOR SELECT USING (true);
CREATE POLICY "Inserir escala_volantes" ON escala_volantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar escala_volantes" ON escala_volantes FOR UPDATE USING (true);
