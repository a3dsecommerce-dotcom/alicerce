-- Adição de colunas extras para a tabela de unidades
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS secretaria TEXT DEFAULT 'SEMED';
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS diretor TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS atendidos_dia INTEGER DEFAULT 0;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();

-- Comentários para documentação
COMMENT ON COLUMN unidades.secretaria IS 'Secretaria vinculada à unidade (Ex: SEMED, SEMSA)';
COMMENT ON COLUMN unidades.atendidos_dia IS 'Quantidade média de pessoas atendidas por dia na unidade';
