-- ================================================================
-- MIGRATION: Adiciona data_abertura em informativos_operacionais
-- data_abertura = timestamp de quando o informativo foi registrado
-- data            = data da ocorrência (falta/extra) — já existia
-- Data: 2026-05-17 | Versão: v753.8.58
-- ================================================================

ALTER TABLE public.informativos_operacionais
  ADD COLUMN IF NOT EXISTS data_abertura TIMESTAMPTZ DEFAULT NOW();

-- Preenche registros antigos com o created_at como data_abertura
UPDATE public.informativos_operacionais
  SET data_abertura = created_at
  WHERE data_abertura IS NULL;

COMMENT ON COLUMN public.informativos_operacionais.data
  IS 'Data da ocorrência: dia da falta, extra ou substituição realizada/a realizar.';

COMMENT ON COLUMN public.informativos_operacionais.data_abertura
  IS 'Data/hora em que o informativo foi aberto e registrado pelo encarregado.';
