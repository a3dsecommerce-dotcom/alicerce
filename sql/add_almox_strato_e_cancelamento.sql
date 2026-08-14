-- =====================================================================
-- MIGRAÇÃO: Almoxarifado — Vínculo Strato
-- Versão: v753.9.1
-- Executar em: Supabase SQL Editor
-- =====================================================================

-- Adiciona a coluna para vincular o número do Strato na tabela de requisições
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS numero_strato TEXT;
