-- ======================================================
-- ADIÇÃO DE FUNCIONALIDADE DE ARQUIVAMENTO
-- Permite limpar a tela sem perder dados para auditoria
-- ======================================================

ALTER TABLE public.requisicoes ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.requisicoes.arquivado IS 'Indica se a requisição foi arquivada para limpeza visual da tela principal';
