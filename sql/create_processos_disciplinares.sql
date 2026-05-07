CREATE TABLE IF NOT EXISTS processos_disciplinares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID NOT NULL,
    colaborador_nome TEXT NOT NULL,
    colaborador_cpf TEXT,
    colaborador_cargo TEXT,
    unidade_alocada TEXT,
    
    encarregado_solicitante_id UUID NOT NULL,
    encarregado_solicitante_nome TEXT NOT NULL,
    
    categoria_motivo TEXT NOT NULL, -- 'CONDUTA_INSUBORDINACAO', 'ASSIDUIDADE', 'SEGURANCA_EPI', 'PATRIMONIO', 'OUTROS'
    descricao_motivo TEXT NOT NULL,
    data_ocorrencia DATE NOT NULL,
    detalhes_ocorrencia TEXT NOT NULL,
    testemunhas TEXT,
    
    nivel_sugerido_encarregado TEXT NOT NULL, -- 'VERBAL', 'ESCRITA', 'SUSPENSAO', 'JUSTA_CAUSA'
    nivel_aplicado_final TEXT, -- Preenchido pela gerência na aprovação
    
    status TEXT DEFAULT 'PENDENTE_GERENCIA' CHECK (status IN ('PENDENTE_GERENCIA', 'PENDENTE_RH', 'APROVADO_RH', 'REJEITADO')),
    
    gerente_aprovador_id UUID,
    gerente_aprovador_nome TEXT,
    observacao_gerencia TEXT,
    
    rh_aprovador_id UUID,
    rh_aprovador_nome TEXT,
    observacao_rh TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para usar com o ERP (usando a anon key)
ALTER TABLE processos_disciplinares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access" ON processos_disciplinares FOR ALL USING (true) WITH CHECK (true);
