-- Tabela de Investigação de CAT (Comunicação de Acidente de Trabalho)
CREATE TABLE IF NOT EXISTS investigacao_cat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do Acidentado
    colaborador_id UUID REFERENCES usuarios(id),
    colaborador_nome TEXT NOT NULL,
    colaborador_cpf TEXT,
    colaborador_cargo TEXT,
    unidade_alocada TEXT,
    
    -- Detalhes da Ocorrência
    data_ocorrido DATE NOT NULL,
    horario_ocorrido TIME NOT NULL,
    local_ocorrido TEXT NOT NULL,
    descricao_local TEXT,
    
    -- Narrativa
    tipo_acidente TEXT CHECK (tipo_acidente IN ('TIPICO', 'TRAJETO', 'DOENCA')),
    descricao_ocorrido TEXT NOT NULL,
    relato_pessoal TEXT,
    tem_testemunha BOOLEAN DEFAULT FALSE,
    testemunhas_detalhes TEXT, -- Nome/Telefone/Depoimento
    
    -- Ações e Acompanhamento
    acoes_tomadas TEXT,
    agente_causador TEXT, -- Ex: Piso molhado, Escada, Ferramenta X
    parte_corpo_atingida TEXT,
    acompanhamento_medico TEXT, -- Hospital, Afastamento, etc.
    
    -- Conclusão
    real_motivo TEXT, -- Causa Raiz
    solucoes_propostas TEXT,
    
    -- Auditoria
    encarregado_responsavel_id UUID REFERENCES usuarios(id),
    status TEXT DEFAULT 'EM_ANALISE' CHECK (status IN ('EM_ANALISE', 'FINALIZADO', 'ENVIADO_RH')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cat_colaborador ON investigacao_cat(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_cat_data ON investigacao_cat(data_ocorrido);
