-- TABELA DE REQUISIÇÕES E ALOCAÇÃO DE VOLANTES
CREATE TABLE IF NOT EXISTS requisicoes_volantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitante_id UUID REFERENCES usuarios(id), -- Diretor ou RH PMG
    unidade_destino TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    quantidade_necessaria INTEGER DEFAULT 1,
    motivo TEXT,
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, ATENDIDA, EM_CURSO, FINALIZADA
    colaboradores_alocados UUID[] DEFAULT '{}', -- Array de IDs de colaboradores volantes
    prioridade TEXT DEFAULT 'NORMAL', -- NORMAL, URGENTE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE requisicoes_volantes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Ver requisicoes_volantes" ON requisicoes_volantes FOR SELECT USING (true);
CREATE POLICY "Inserir requisicoes_volantes" ON requisicoes_volantes FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar requisicoes_volantes" ON requisicoes_volantes FOR UPDATE USING (true);
