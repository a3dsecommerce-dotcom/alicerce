-- ALTER TABLE TO ADD NEW FLYER/SUBSTITUTE SCALE FIELDS
ALTER TABLE requisicoes_volantes 
ADD COLUMN IF NOT EXISTS quem_requisitou TEXT,
ADD COLUMN IF NOT EXISTS colaborador_substituido_nome TEXT,
ADD COLUMN IF NOT EXISTS is_atestado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS asg_porcentagem INTEGER,
ADD COLUMN IF NOT EXISTS funcao_substituicao TEXT;

COMMENT ON COLUMN requisicoes_volantes.quem_requisitou IS 'Quem requisitou o volante: DIRETOR, ENCARREGADO, SEMED_RH, ou nome/cargo';
COMMENT ON COLUMN requisicoes_volantes.colaborador_substituido_nome IS 'Nome do colaborador que está sendo substituído';
COMMENT ON COLUMN requisicoes_volantes.is_atestado IS 'Indica se a substituição é decorrente de atestado médico';
COMMENT ON COLUMN requisicoes_volantes.asg_porcentagem IS 'Se for substituição de ASG, informa se é de 20% ou 40% de insalubridade';
COMMENT ON COLUMN requisicoes_volantes.funcao_substituicao IS 'Função a ser substituída (ASG, Cozinheira, Porteiro, etc.)';
