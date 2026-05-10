-- SCRIPT DE UNIFICAÇÃO DE DATAS DE ADMISSÃO (FORÇADO)
-- Objetivo: Resetar TODAS as datas de admissão sem exceções.

-- 1. Executa a atualização em massa
UPDATE usuarios
SET data_admissao = '2026-01-01';

-- 2. Verifica se a alteração foi aplicada
SELECT id, nome, data_admissao, status 
FROM usuarios 
ORDER BY data_admissao DESC 
LIMIT 20;
