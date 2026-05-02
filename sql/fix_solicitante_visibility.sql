-- Adiciona identificador único do solicitante para garantir visibilidade
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS solicitante_tel TEXT;
COMMENT ON COLUMN tickets_sla.solicitante_tel IS 'Telefone único do solicitante para garantir que ele veja suas próprias solicitações independentemente do nome';

-- Atualiza registros existentes se possível (opcional)
-- UPDATE tickets_sla SET solicitante_tel = 'SISTEMA' WHERE solicitante_tel IS NULL;
