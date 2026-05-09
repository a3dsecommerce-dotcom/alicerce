-- MIGRAÇÃO DE COLUNAS ESTÁTICAS PARA CHECKLIST DINÂMICO
-- Este script move os dados das colunas fixas (doc_*) para o campo JSONB checklist_extra
-- permitindo que todas as colunas sejam gerenciáveis pelo usuário.

-- 1. Inserir as labels padrão na configuração se não existirem
INSERT INTO config_checklist_rh (label)
VALUES 
  ('ASU'), ('VT'), ('TICKET'), ('CONTRATO'), ('FARDA'), 
  ('RG/CPF'), ('RESID'), ('ESCOL'), ('TIT/RES'), ('CERTID'), 
  ('ANTEC'), ('CTPS'), ('FOTO')
ON CONFLICT (label) DO NOTHING;

-- 2. Migrar dados existentes para o JSONB checklist_extra
-- Vamos mesclar os dados antigos com o que já existe no JSONB
UPDATE usuarios
SET checklist_extra = jsonb_strip_nulls(
  coalesce(checklist_extra, '{}'::jsonb) || 
  jsonb_build_object(
    'ASU', doc_asu,
    'VT', doc_vt,
    'TICKET', doc_ticket,
    'CONTRATO', doc_contrato,
    'FARDA', doc_fardamento,
    'RG/CPF', doc_rg_cpf,
    'RESID', doc_residencia,
    'ESCOL', doc_escolaridade,
    'TIT/RES', doc_titulo_reservista,
    'CERTID', doc_certidoes,
    'ANTEC', doc_antecedentes,
    'CTPS', doc_ctps_pis,
    'FOTO', doc_foto
  )
)
WHERE status_ciclo = 'ATIVO' OR status = 'EM_ADMISSAO' OR status = 'DESLIGADO';

-- Nota: Mantemos as colunas originais doc_* por segurança para auditoria legada,
-- mas a partir de agora a interface usará apenas o motor dinâmico.
