-- Padronização do nome do cargo "Serviços Gerais"
-- Remove as porcentagens do nome e unifica a nomenclatura

-- 1. Atualização na tabela de colaboradores (usuarios)
UPDATE usuarios 
SET cargo = 'SERVIÇOS GERAIS'
WHERE cargo ILIKE '%AUXILIAR DE SERVIÇOS GERAIS%' 
   OR cargo ILIKE '%SERVIÇO GERAIS%';

-- 2. Atualização na tabela de quotas (vagas_quadro)
UPDATE vagas_quadro
SET cargo = 'SERVIÇOS GERAIS'
WHERE cargo ILIKE '%AUXILIAR DE SERVIÇOS GERAIS%'
   OR cargo ILIKE '%SERVIÇO GERAIS%';

-- 3. Caso existam registros específicos com as porcentagens no nome, garante a limpeza
UPDATE usuarios SET cargo = 'SERVIÇOS GERAIS' WHERE cargo = 'AUXILIAR DE SERVIÇOS GERAIS 20%';
UPDATE usuarios SET cargo = 'SERVIÇOS GERAIS' WHERE cargo = 'AUXILIAR DE SERVIÇOS GERAIS 40%';
UPDATE vagas_quadro SET cargo = 'SERVIÇOS GERAIS' WHERE cargo = 'AUXILIAR DE SERVIÇOS GERAIS 20%';
UPDATE vagas_quadro SET cargo = 'SERVIÇOS GERAIS' WHERE cargo = 'AUXILIAR DE SERVIÇOS GERAIS 40%';
