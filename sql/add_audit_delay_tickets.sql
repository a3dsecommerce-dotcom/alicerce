-- ADICIONA CAMPO DE AUDITORIA DE ATRASO NA TABELA DE TICKETS SLA
ALTER TABLE public.tickets_sla ADD COLUMN IF NOT EXISTS atrasado_na_entrega BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN public.tickets_sla.atrasado_na_entrega IS 'Indica se a ocorrência foi resolvida após o prazo acordado (FALIT)';
