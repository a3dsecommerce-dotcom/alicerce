-- ADICIONA CAMPOS DE RESPONSÁVEL CITADO À TABELA DE TICKETS SLA
ALTER TABLE public.tickets_sla ADD COLUMN IF NOT EXISTS responsavel_citado_id UUID REFERENCES public.usuarios(id);
ALTER TABLE public.tickets_sla ADD COLUMN IF NOT EXISTS responsavel_citado_nome TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.tickets_sla.responsavel_citado_id IS 'ID do colaborador/responsável citado na ocorrência';
COMMENT ON COLUMN public.tickets_sla.responsavel_citado_nome IS 'Nome do responsável citado';
