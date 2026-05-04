-- ADICIONA CAMPOS DE INTERESSADO E REPRESENTANTE À TABELA DE TICKETS SLA
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS interessado_id UUID;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS interessado_nome TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS secretaria TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS funcao TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS representante_id UUID;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS representante_nome TEXT;

-- Comentários para documentação
COMMENT ON COLUMN tickets_sla.interessado_id IS 'ID do colaborador que é o interessado direto na ocorrência';
COMMENT ON COLUMN tickets_sla.interessado_nome IS 'Nome do colaborador interessado';
COMMENT ON COLUMN tickets_sla.secretaria IS 'Secretaria do interessado (SEMED, SEMSA, etc)';
COMMENT ON COLUMN tickets_sla.funcao IS 'Cargo ou função operacional do interessado';
COMMENT ON COLUMN tickets_sla.representante_id IS 'ID do encarregado ou gestor que está abrindo o chamado em nome do interessado';
COMMENT ON COLUMN tickets_sla.representante_nome IS 'Nome do representante que abriu o chamado';
