-- Adição de colunas de auditoria para a tabela de usuários
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'COLABORADOR';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS criado_por TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS editado_por TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS justificativa_alteracao TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_ultima_alteracao TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN usuarios.criado_por IS 'Nome do gestor que realizou a admissão ou cadastro inicial';
COMMENT ON COLUMN usuarios.editado_por IS 'Nome do último gestor a alterar o cadastro';
COMMENT ON COLUMN usuarios.justificativa_alteracao IS 'Justificativa obrigatória para alterações cadastrais realizadas por Encarregados';
COMMENT ON COLUMN usuarios.data_ultima_alteracao IS 'Timestamp da última modificação realizada no perfil';
