-- Adiciona coluna de escala à tabela de quadro de vagas
ALTER TABLE vagas_quadro ADD COLUMN IF NOT EXISTS escala TEXT DEFAULT '44H';

-- Comentário
COMMENT ON COLUMN vagas_quadro.escala IS 'Escala de trabalho (ex: 44H, 12X36)';
