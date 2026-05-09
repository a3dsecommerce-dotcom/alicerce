-- Script para sistema de checklist dinâmico
-- Executar no Console SQL do Supabase

-- 1. Tabela para configurar quais colunas extras existem
CREATE TABLE IF NOT EXISTS config_checklist_rh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Adicionar coluna JSONB nos usuários para armazenar os valores dessas colunas extras
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS checklist_extra JSONB DEFAULT '{}'::jsonb;

-- 3. Habilitar RLS
ALTER TABLE config_checklist_rh ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode ler config_checklist" ON config_checklist_rh;
CREATE POLICY "Qualquer um pode ler config_checklist" ON config_checklist_rh 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Qualquer um pode inserir config_checklist" ON config_checklist_rh;
CREATE POLICY "Qualquer um pode inserir config_checklist" ON config_checklist_rh 
FOR INSERT WITH CHECK (true);

-- 4. Inserir alguns exemplos iniciais (opcional, mas ajuda a entender)
-- INSERT INTO config_checklist_rh (label) VALUES ('Votação 2024'), ('Curso NR10');
