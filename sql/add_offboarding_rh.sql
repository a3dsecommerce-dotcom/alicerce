-- Script para adicionar colunas do fluxo de desligamento (offboarding)
-- Executar no Console SQL do Supabase

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS data_demissao DATE,
ADD COLUMN IF NOT EXISTS desligamento_formato TEXT, -- Pedido, Sem Justa Causa, etc
ADD COLUMN IF NOT EXISTS desligamento_form_preenchido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_email_formalizado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_strato_docs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_aviso_previo_fim DATE,
ADD COLUMN IF NOT EXISTS desligamento_ponto_corrigido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_exame_agendado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_exame_feito BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_trct_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_trct_limite DATE,
ADD COLUMN IF NOT EXISTS desligamento_trct_assinado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_uniforme_devolvido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS desligamento_strato_final BOOLEAN DEFAULT false;

-- Comentário para auditoria
COMMENT ON COLUMN usuarios.desligamento_formato IS 'Tipo de desligamento (Pedido, Dispensa, etc)';
