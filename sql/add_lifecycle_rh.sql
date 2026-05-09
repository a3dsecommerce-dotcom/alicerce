-- Script para implementar Ciclo de Vida do Colaborador e Checklist de Documentação
-- Executar no Console SQL do Supabase

-- Adicionando colunas de controle de carreira e experiência
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_admissao DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_ciclo TEXT DEFAULT 'ATIVO'; -- TALENTO, ADMITIDO, ATIVO, DESLIGADO

-- Controle de Decisão de Experiência
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS exp1_decisao TEXT DEFAULT 'PENDENTE'; -- PENDENTE, RENOVADO, DISPENSADO
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS exp2_decisao TEXT DEFAULT 'PENDENTE'; -- PENDENTE, EFETIVADO, DISPENSADO

-- Colunas para Checklist de Documentação (Compliance)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doc_asu BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doc_vt BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doc_ticket BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doc_contrato BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS doc_fardamento BOOLEAN DEFAULT FALSE;

-- Comentários para auditoria
COMMENT ON COLUMN usuarios.data_admissao IS 'Data oficial de início para cálculo de experiência (30/90 dias)';
COMMENT ON COLUMN usuarios.status_ciclo IS 'Status no ciclo de vida: TALENTO (Candidato), ADMITIDO (Em contratação), ATIVO, DESLIGADO';
COMMENT ON COLUMN usuarios.exp1_decisao IS 'Decisão do RH após os primeiros 30 dias';
COMMENT ON COLUMN usuarios.exp2_decisao IS 'Decisão final do RH após os 90 dias';
