-- ATUALIZAÇÃO DA TABELA DE OCORRÊNCIAS (TICKETS SLA)
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS setor_destino TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS responsavel_citado TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS justificativa_solucao TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN tickets_sla.setor_destino IS 'Setor responsável por resolver a ocorrência (ex: RH, Almoxarifado, TI)';
COMMENT ON COLUMN tickets_sla.responsavel_citado IS 'Nome do colaborador citado na ocorrência (se houver)';
COMMENT ON COLUMN tickets_sla.justificativa_solucao IS 'Texto obrigatório ao encerrar a ocorrência explicando como foi resolvida';
