-- Migração para adicionar colunas de resposta do encarregado/supervisor
ALTER TABLE ajustes_ponto ADD COLUMN IF NOT EXISTS resposta_encarregado TEXT;
ALTER TABLE ajustes_ponto ADD COLUMN IF NOT EXISTS data_resposta_encarregado TIMESTAMPTZ;
