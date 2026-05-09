-- Tabela de Logs de Auditoria do Sistema
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    usuario_id UUID REFERENCES usuarios(id),
    usuario_nome TEXT,
    acao TEXT NOT NULL, -- EXCLUSAO, EDICAO, LOGIN, etc
    entidade TEXT, -- informativos_operacionais, usuarios, etc
    entidade_id TEXT,
    justificativa TEXT NOT NULL,
    detalhes JSONB, -- Backup do dado antes da ação
    ip_origem TEXT
);

-- RLS e Segurança
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas Master pode ver logs" ON logs_auditoria
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND nivel >= 3
        )
    );

CREATE POLICY "Qualquer logado pode inserir log" ON logs_auditoria
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs_auditoria(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON logs_auditoria(entidade);
