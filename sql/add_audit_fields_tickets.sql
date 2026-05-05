-- ADICIONA CAMPOS DE AUDITORIA PARA RECEBIMENTO E RESOLUÇÃO DE OCORRÊNCIAS
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS recebido_por_id UUID;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS recebido_por_nome TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS resolvido_por_id UUID;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS resolvido_por_nome TEXT;

-- Comentários para documentação
COMMENT ON COLUMN tickets_sla.recebido_por_id IS 'ID do usuário que registrou o recebimento da ocorrência';
COMMENT ON COLUMN tickets_sla.recebido_por_nome IS 'Nome do usuário que recebeu a ocorrência';
COMMENT ON COLUMN tickets_sla.resolvido_por_id IS 'ID do usuário que registrou a solução final';
COMMENT ON COLUMN tickets_sla.resolvido_por_nome IS 'Nome do usuário que resolveu a ocorrência';
