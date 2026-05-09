-- Script de higienização de dados: Normalizar datas de admissão
-- Executar no Console SQL do Supabase

UPDATE usuarios 
SET data_admissao = '2026-01-01'
WHERE data_admissao IS NULL;

-- Opcional: Marcar itens de admissão como concluídos para quem já é ATIVO
UPDATE usuarios 
SET 
  adm_compareceu = true,
  adm_docs_entregues = true,
  adm_docs_completos = true,
  adm_aso_liberado = true,
  adm_strato_cadastro = true,
  adm_ponto_cadastrado = true
WHERE status = 'ATIVO' 
AND (adm_compareceu = false OR adm_compareceu IS NULL);
