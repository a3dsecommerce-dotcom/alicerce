-- Adição de colunas extras para a tabela de unidades
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS secretaria TEXT DEFAULT 'SEMED';
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS diretor TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS atendidos_dia INTEGER DEFAULT 0;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS rota TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS encarregado_id UUID;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS encarregado_nome TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

-- Comentários para documentação
COMMENT ON COLUMN unidades.secretaria IS 'Secretaria vinculada à unidade (Ex: SEMED, SEMSA)';
COMMENT ON COLUMN unidades.atendidos_dia IS 'Quantidade média de pessoas atendidas por dia na unidade';
COMMENT ON COLUMN unidades.status IS 'Estado operacional da unidade (ATIVO/INATIVO)';
COMMENT ON COLUMN unidades.rota IS 'Identificação da rota operacional (Ex: Rota 1, Rota 2)';
COMMENT ON COLUMN unidades.encarregado_id IS 'ID do encarregado responsável (vindo de config_rotas)';
COMMENT ON COLUMN unidades.encarregado_nome IS 'Nome do encarregado responsável (vindo de config_rotas)';
