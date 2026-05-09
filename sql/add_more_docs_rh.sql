-- Script para adicionar mais colunas de checklist de documentos
-- Executar no Console SQL do Supabase

ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS doc_rg_cpf BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_residencia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_escolaridade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_titulo_reservista BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_certidoes BOOLEAN DEFAULT false, -- Nascimento/Casamento/Filhos
ADD COLUMN IF NOT EXISTS doc_antecedentes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_ctps_pis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS doc_foto BOOLEAN DEFAULT false;

-- Comentários
COMMENT ON COLUMN usuarios.doc_rg_cpf IS 'Checklist: RG e CPF entregues';
COMMENT ON COLUMN usuarios.doc_certidoes IS 'Checklist: Certidões de Nascimento/Casamento/Filhos';
