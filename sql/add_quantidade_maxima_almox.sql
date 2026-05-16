-- ================================================================
-- MIGRATION: Adiciona quantidade_maxima nas tabelas de estoque
-- Controla o limite máximo por requisição (cota por pedido)
-- Data: 2026-05-16 | Versão: v753.8.57
-- ================================================================

-- 1. Tabela EPI
ALTER TABLE public.almox_epi 
  ADD COLUMN IF NOT EXISTS quantidade_maxima INTEGER DEFAULT 0;

COMMENT ON COLUMN public.almox_epi.quantidade_maxima 
  IS 'Quantidade máxima permitida por requisição mensal. 0 = sem limite definido.';

-- 2. Tabela Suprimentos
ALTER TABLE public.almox_suprimentos 
  ADD COLUMN IF NOT EXISTS quantidade_maxima INTEGER DEFAULT 0;

COMMENT ON COLUMN public.almox_suprimentos.quantidade_maxima 
  IS 'Quantidade máxima permitida por requisição mensal. 0 = sem limite definido.';

-- 3. Tabela Escritório
ALTER TABLE public.almox_escritorio 
  ADD COLUMN IF NOT EXISTS quantidade_maxima INTEGER DEFAULT 0;

COMMENT ON COLUMN public.almox_escritorio.quantidade_maxima 
  IS 'Quantidade máxima permitida por requisição mensal. 0 = sem limite definido.';
