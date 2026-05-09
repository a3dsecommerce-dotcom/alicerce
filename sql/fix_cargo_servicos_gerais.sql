-- Padronização de nomes de cargos
-- Remove as porcentagens do nome e unifica a nomenclatura

-- ==========================================
-- 1. SERVIÇOS GERAIS
-- ==========================================
UPDATE usuarios 
SET cargo = 'SERVIÇOS GERAIS'
WHERE cargo ILIKE '%AUXILIAR DE SERVIÇOS GERAIS%' 
   OR cargo ILIKE '%SERVIÇO GERAIS%';

UPDATE vagas_quadro
SET cargo = 'SERVIÇOS GERAIS'
WHERE cargo ILIKE '%AUXILIAR DE SERVIÇOS GERAIS%'
   OR cargo ILIKE '%SERVIÇO GERAIS%';

-- ==========================================
-- 2. PORTEIRO
-- ==========================================
UPDATE usuarios 
SET cargo = 'PORTEIRO'
WHERE cargo ILIKE 'PORTEIRO%';

UPDATE vagas_quadro
SET cargo = 'PORTEIRO'
WHERE cargo ILIKE 'PORTEIRO%';

-- ==========================================
-- 3. MOTORISTA
-- ==========================================
UPDATE usuarios 
SET cargo = 'MOTORISTA'
WHERE cargo ILIKE 'MOTORISTA%';

UPDATE vagas_quadro
SET cargo = 'MOTORISTA'
WHERE cargo ILIKE 'MOTORISTA%';

-- 4. Limpeza específica de porcentagens residuais
UPDATE usuarios SET cargo = 'SERVIÇOS GERAIS' WHERE cargo IN ('AUXILIAR DE SERVIÇOS GERAIS 20%', 'AUXILIAR DE SERVIÇOS GERAIS 40%');
UPDATE vagas_quadro SET cargo = 'SERVIÇOS GERAIS' WHERE cargo IN ('AUXILIAR DE SERVIÇOS GERAIS 20%', 'AUXILIAR DE SERVIÇOS GERAIS 40%');
UPDATE usuarios SET cargo = 'PORTEIRO' WHERE cargo IN ('PORTEIRO 20%', 'PORTEIRO 40%');
UPDATE vagas_quadro SET cargo = 'PORTEIRO' WHERE cargo IN ('PORTEIRO 20%', 'PORTEIRO 40%');
UPDATE usuarios SET cargo = 'MOTORISTA' WHERE cargo IN ('MOTORISTA 20%', 'MOTORISTA 40%');
UPDATE vagas_quadro SET cargo = 'MOTORISTA' WHERE cargo IN ('MOTORISTA 20%', 'MOTORISTA 40%');
