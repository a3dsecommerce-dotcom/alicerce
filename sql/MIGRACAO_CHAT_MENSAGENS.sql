-- ==========================================
-- ALICERCE ERP — Módulo de Chat Privado
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. Criação da Tabela de Mensagens
CREATE TABLE IF NOT EXISTS chat_mensagens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo    TEXT NOT NULL,
    lida        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criação de Índices para Busca Rápida
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_mensagens(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_mensagens(receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_mensagens(created_at);

-- 3. Habilitar Segurança em Nível de Linha (RLS)
ALTER TABLE chat_mensagens ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso
DROP POLICY IF EXISTS "Permitir leitura para participantes" ON chat_mensagens;
CREATE POLICY "Permitir leitura para participantes" ON chat_mensagens 
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Permitir envio de mensagens" ON chat_mensagens;
CREATE POLICY "Permitir envio de mensagens" ON chat_mensagens 
    FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir marcar como lida" ON chat_mensagens;
CREATE POLICY "Permitir marcar como lida" ON chat_mensagens 
    FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "service_role_chat_all" ON chat_mensagens;
CREATE POLICY "service_role_chat_all" ON chat_mensagens 
    FOR ALL 
    USING (auth.role() = 'service_role') 
    WITH CHECK (auth.role() = 'service_role');
