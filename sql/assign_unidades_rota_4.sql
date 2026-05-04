-- SCRIPT: Organização de Unidades por Rota (Rota 4)
BEGIN;

-- 1. Garantir que a coluna rota existe
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS rota TEXT;

-- 2. Atualizar as unidades da Rota 4
UPDATE unidades SET rota = 'Rota 4' 
WHERE nome IN (
    'CEMEI MARIA GAMA DOS SANTOS',
    'CEMEI TERCILIA ASTORI GOBBI',
    'CEMEI THEREZINHA SILVA COSTA',
    'CEMEITI VOVÓ ARLETE',
    'CENTRO MUNICIPAL DE EJA (CMEJA)',
    'Complexo Esportivo e Cultural Maurice Santos',
    'NAEE (Núcleo de Atendimento Educacional Especializado)',
    'EMEFTI PRESIDENTE COSTA E SILVA',
    'EMEF ANA ROCHA LYRA',
    'EMEIEFTI FLORISBELA LINO BANDEIRA',
    'EMEIEF MARIA DAS GRAÇAS SANTANA MENARIO',
    'EMEIEF MARIA VELOSO CALMON',
    'EMEIEF ZILNETE PEREIRA GUIMARÃES',
    'ALMOXARIFADO'
);

-- Garantia extra para o Almoxarifado e NAEE
UPDATE unidades SET rota = 'Rota 4' WHERE nome ILIKE '%ALMOXARIFADO%';
UPDATE unidades SET rota = 'Rota 4' WHERE nome ILIKE '%NAEE%';

COMMIT;
