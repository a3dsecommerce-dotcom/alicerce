-- Migration: Adicionar campos escolares na tabela unidades
ALTER TABLE unidades 
ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
ADD COLUMN IF NOT EXISTS responsavel_telefone TEXT,
ADD COLUMN IF NOT EXISTS quantidade_alunos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_integral BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS horario_funcionamento TEXT,
ADD COLUMN IF NOT EXISTS tem_cozinheira_efetiva BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quantidade_cozinheiras INTEGER DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN unidades.quantidade_alunos IS 'Número total de alunos matriculados na unidade';
COMMENT ON COLUMN unidades.is_integral IS 'Informa se a unidade opera em regime integral';
COMMENT ON COLUMN unidades.tem_cozinheira_efetiva IS 'Informa se a unidade possui cozinheiras do quadro efetivo da prefeitura';
