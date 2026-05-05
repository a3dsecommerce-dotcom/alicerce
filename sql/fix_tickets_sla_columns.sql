-- GARANTE TODAS AS COLUNAS DA TABELA TICKETS_SLA PARA O MÓDULO DE OCORRÊNCIAS
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS data_recebimento TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS prazo_prometido TIMESTAMP WITH TIME ZONE;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS solucao_descricao TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS atribuido_a TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS setor_destino TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS responsavel_citado TEXT;
ALTER TABLE tickets_sla ADD COLUMN IF NOT EXISTS justificativa_solucao TEXT;

-- Comentários para documentação
COMMENT ON COLUMN tickets_sla.data_recebimento IS 'Timestamp de quando o setor responsável recebeu a ocorrência';
COMMENT ON COLUMN tickets_sla.prazo_prometido IS 'Data prometida pelo setor para a resolução final';
COMMENT ON COLUMN tickets_sla.solucao_descricao IS 'Descrição detalhada da solução aplicada';
