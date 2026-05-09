-- Script para garantir a existência e funcionamento da tabela de atividades
-- Executar no Console SQL do Supabase

CREATE TABLE IF NOT EXISTS atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    usuario_nome TEXT,
    mensagem TEXT,
    tipo TEXT, -- RH, OCORRENCIA, OPERACIONAL, SISTEMA
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Qualquer um pode ler atividades" ON atividades;
CREATE POLICY "Qualquer um pode ler atividades" ON atividades 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Qualquer um pode inserir atividades" ON atividades;
CREATE POLICY "Qualquer um pode inserir atividades" ON atividades 
FOR INSERT WITH CHECK (true);

-- Comentários
COMMENT ON TABLE atividades IS 'Log de auditoria e atividades em tempo real para o Painel de Gerência';
