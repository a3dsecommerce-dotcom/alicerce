-- SCRIPT: Organização de Unidades por Rota (Rota 2)
BEGIN;

-- 1. Garantir que a coluna rota existe
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS rota TEXT;

-- 2. Atualizar as unidades da Rota 2
UPDATE unidades SET rota = 'Rota 2' 
WHERE nome IN (
    'CEMEITI CLARIONÍCIO RAMALHETE',
    'CEMEI ILCLÉIA FERNANDES BASTOS DE ÁVILA',
    'CEMEI MARIA IGNES ALEIXO PINNA',
    'CEMEITI VEREADOR FRANCISCO DE ASSIS PEREIRA DUARTE',
    'EMEF DARCY RIBEIRO',
    'EMEIEF CONSTANTINO JOSÉ VIEIRA',
    'EMEFTI DALZIRA MERIGUETTI MERÍSIO',
    'EMEFTI IGNEZ MASSAD COLA',
    'EMEIEF PROF.ª MARIA MARTA DALLA HUARCAYA',
    'CEMEI MARIA INÊS JULIÃO GOTTARDO',
    'EMEIEF LÚCIA SASSO BANDEIRA',
    'EMEIEF JORGE BOUERI SOBRINHO'
);

-- Caso o nome tenha sido inserido sem acentos em algum momento, garantimos com ILIKE para as principais
UPDATE unidades SET rota = 'Rota 2' WHERE nome ILIKE '%CLARIONICIO%';
UPDATE unidades SET rota = 'Rota 2' WHERE nome ILIKE '%ILCLEIA FERNANDES%';
UPDATE unidades SET rota = 'Rota 2' WHERE nome ILIKE '%VEREADOR FRANCISCO PEREIRA%';
UPDATE unidades SET rota = 'Rota 2' WHERE nome ILIKE '%DARCY RIBEIRO%';
UPDATE unidades SET rota = 'Rota 2' WHERE nome ILIKE '%DALZIRA MERIGUETE%';

COMMIT;
