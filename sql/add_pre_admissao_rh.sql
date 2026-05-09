-- Script para fluxo completo de Pré-Admissão (Admitidos Pré)
-- Executar no Console SQL do Supabase

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS adm_telefone TEXT,
ADD COLUMN IF NOT EXISTS adm_entrevista_data DATE,
ADD COLUMN IF NOT EXISTS adm_compareceu BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_exame_encaminhamento DATE,
ADD COLUMN IF NOT EXISTS adm_docs_entregues BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_docs_completos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_aso_liberado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_exame_liberacao_data DATE,
ADD COLUMN IF NOT EXISTS adm_entrega_isadora_data DATE,
ADD COLUMN IF NOT EXISTS adm_strato_cadastro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_strato_numero TEXT,
ADD COLUMN IF NOT EXISTS adm_carta_banco BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_os_epi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_contrato_liberado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_ponto_cadastrado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_boas_vindas_msg BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_assinatura_isadora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_vt_enviado_dp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_va_solicitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_plano_saude BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_conta_banco_aberta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_conta_strato_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_docs_strato BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_exp1_vencimento DATE,
ADD COLUMN IF NOT EXISTS adm_assinatura_encarregado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS adm_assinatura_2_strato BOOLEAN DEFAULT false;

-- Comentário para organização
COMMENT ON COLUMN usuarios.adm_strato_numero IS 'Número do registro no sistema STRATO';
