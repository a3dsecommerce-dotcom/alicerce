-- Adiciona coluna de insalubridade na tabela de usuários para controle do Diretor
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS percentual_insalubridade TEXT DEFAULT 'N/A';

-- Comentário para documentação
COMMENT ON COLUMN usuarios.percentual_insalubridade IS 'Percentual de insalubridade definido pelo Diretor da Unidade (N/A, 20%, 30%, 40%)';

-- Atualização automática para quem é da COZINHA (sempre 20%)
UPDATE usuarios 
SET percentual_insalubridade = '20%' 
WHERE cargo ILIKE '%COZINHA%' OR cargo ILIKE '%MERENDEIRA%' OR cargo ILIKE '%COZINHEIRO%';
