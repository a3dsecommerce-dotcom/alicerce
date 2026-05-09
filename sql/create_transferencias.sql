-- Tabela de Solicitações de Transferência
CREATE TABLE IF NOT EXISTS transferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES usuarios(id),
    colaborador_nome TEXT,
    unidade_origem TEXT,
    unidade_destino_pretendida TEXT,
    motivo_solicitacao TEXT,
    
    -- Status Workflow: SOLICITADO, ACEITO_ENCARREGADO, RECUSADO_ENCARREGADO, APROVADO_GERENCIA, RECUSADO_GERENCIA, ARQUIVADO, FINALIZADO_RH
    status TEXT DEFAULT 'SOLICITADO',
    
    -- Etapa 1: Encarregado
    encarregado_id UUID REFERENCES usuarios(id),
    encarregado_nome TEXT,
    justificativa_encarregado TEXT,
    data_analise_encarregado TIMESTAMPTZ,
    
    -- Etapa 2: Gerente Operacional
    gerente_id UUID REFERENCES usuarios(id),
    gerente_nome TEXT,
    justificativa_gerente TEXT,
    data_analise_gerente TIMESTAMPTZ,
    
    -- Etapa 3: RH (Finalização)
    rh_id UUID REFERENCES usuarios(id),
    rh_nome TEXT,
    data_finalizacao_rh TIMESTAMPTZ,
    observacoes_rh TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE transferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias transferências" ON transferencias
    FOR SELECT USING (auth.uid() = colaborador_id);

CREATE POLICY "Encarregados e Gerentes podem ver todas" ON transferencias
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND nivel >= 2
        )
    );

CREATE POLICY "Qualquer logado pode inserir solicitação" ON transferencias
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Nível 2+ pode atualizar status" ON transferencias
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND nivel >= 2
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_transferencias_status ON transferencias(status);
CREATE INDEX IF NOT EXISTS idx_transferencias_colab ON transferencias(colaborador_id);
