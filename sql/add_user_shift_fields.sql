-- Adição de campos técnicos de jornada e remuneração na tabela de usuários
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS insalubridade TEXT; -- Ex: '20%', '40%', 'N/A'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS carga_horaria TEXT; -- Ex: '12X36', '44H', '20H'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_entrada TIME;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_saida TIME;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS escala_tipo TEXT; -- 'PAR', 'IMPAR', 'DIARIO'
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_referencia_escala DATE; -- Para resolver o problema do dia 31/01

-- Comentários para suporte ao desenvolvedor
COMMENT ON COLUMN usuarios.escala_tipo IS 'Define a paridade da escala 12x36 ou se é jornada diária fixa';
COMMENT ON COLUMN usuarios.data_referencia_escala IS 'Data de início da escala para cálculo de alternância (evita erro de dias 31 seguidos de dia 01)';

-- Sincronização inicial (opcional)
UPDATE usuarios SET carga_horaria = '44H' WHERE carga_horaria IS NULL;
UPDATE usuarios SET escala_tipo = 'DIARIO' WHERE escala_tipo IS NULL;
