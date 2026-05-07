-- 1. Tabela para registrar Faltas informadas pelos Encarregados via App
CREATE TABLE IF NOT EXISTS registro_faltas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES usuarios(id),
    colaborador_nome TEXT NOT NULL,
    unidade_id UUID REFERENCES unidades(id),
    unidade_nome TEXT NOT NULL,
    data_falta DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo TEXT,
    status TEXT DEFAULT 'PENDENTE_RH', -- PENDENTE_RH, ABONADA, DESCONTADA
    registrado_por_id UUID REFERENCES usuarios(id),
    registrado_por_nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faltas_colaborador ON registro_faltas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_faltas_unidade ON registro_faltas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_faltas_data ON registro_faltas(data_falta);

-- 2. Tabela Hub para Solicitações do Encarregado para o RH (Volantes, Advertências, Transferências)
CREATE TABLE IF NOT EXISTS solicitacoes_rh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL, -- 'VOLANTE', 'ADVERTENCIA', 'TRANSFERENCIA', 'AJUSTE_PONTO'
    colaborador_id UUID REFERENCES usuarios(id), -- Pode ser null se for pedido de volante sem nome
    colaborador_nome TEXT,
    unidade_id UUID REFERENCES unidades(id),
    unidade_nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT DEFAULT 'ABERTA', -- ABERTA, EM_ANALISE, APROVADA, RECUSADA, CONCLUIDA
    solicitante_id UUID REFERENCES usuarios(id),
    solicitante_nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- Para guardar dados extras (ex: nova unidade de transferencia)
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_tipo ON solicitacoes_rh(tipo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_rh(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_unidade ON solicitacoes_rh(unidade_id);

-- 3. Tabela para o botão de Check-in Global (com geolocalização)
CREATE TABLE IF NOT EXISTS checkins_operacionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) NOT NULL,
    usuario_nome TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    dispositivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_usuario ON checkins_operacionais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_checkins_data ON checkins_operacionais(created_at);

-- Habilitar RLS em todas as tabelas
ALTER TABLE registro_faltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_rh ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins_operacionais ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso: Todos podem inserir, mas leitura depende do papel (simplificado para admin/geral)
CREATE POLICY "Leitura global faltas" ON registro_faltas FOR SELECT USING (true);
CREATE POLICY "Inserir faltas" ON registro_faltas FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar faltas" ON registro_faltas FOR UPDATE USING (true);

CREATE POLICY "Leitura global solicitacoes" ON solicitacoes_rh FOR SELECT USING (true);
CREATE POLICY "Inserir solicitacoes" ON solicitacoes_rh FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar solicitacoes" ON solicitacoes_rh FOR UPDATE USING (true);

CREATE POLICY "Leitura global checkins" ON checkins_operacionais FOR SELECT USING (true);
CREATE POLICY "Inserir checkins" ON checkins_operacionais FOR INSERT WITH CHECK (true);
