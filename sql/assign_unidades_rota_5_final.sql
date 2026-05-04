-- SCRIPT: Organização de Unidades por Rota (Rota 5 - COMPLETO)
BEGIN;

-- 1. Garantir que a coluna rota existe
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS rota TEXT;

-- 2. Atualizar todas as unidades da Rota 5 (Lista Massiva)
UPDATE unidades SET rota = 'Rota 5' 
WHERE nome IN (
    'USF PEDRO MACHADO',
    'USF CAMURUGI',
    'SEDE DA SEMSA',
    'POSTO DE SAÚDE ARNALDO MAGALHAES',
    'CTAHIFA DESATIVADO',
    'ALMOXARIFADO DA FARMACIA POPULAR',
    'CASA 1',
    'CASA 2',
    'RESIDENCIA INCLUSIVA',
    'CENTRO DIA PCD',
    'CADUNICO',
    'SEDE SEMTAC',
    'SEMOB - Superintendência Executiva de Mobilidade Urbana',
    'AEROPORTO',
    'PREFEITURA DE GUARAPARI',
    'SEMIC - Secretaria Municipal de Integração da Cidade',
    'CENTRO ADMINISTRATIVO BENEDITO LYRA',
    'UPA',
    'POSTO DE SAUDE MARIO SERGIO',
    'FAMILIA ACOLHEDORA',
    'CRAS OLARIA',
    'FROTA DE VEICULO',
    'FEIRA LIVRE / MERCADO RURAL',
    'POSTO DE SAÚDE ROBERTO CALMON',
    'SAÚDE DA MULHER',
    'CAPS 1',
    'TUBERCULOSE',
    'CENTRO MUNICIPAL DE SAÚDE',
    'USF CAIC',
    'USF THEREZA LOYOLA DE JESUS',
    'SEMSET - CENTRO ADMINISTRATIVO',
    'FARMACIA NO CENTRO ADMINISTRATIVO',
    'SEMFA - PREFEITURA DE GUARAPARI'
);

-- Garantia para nomes com siglas
UPDATE unidades SET rota = 'Rota 5' WHERE nome ILIKE '%SEMSA%';
UPDATE unidades SET rota = 'Rota 5' WHERE nome ILIKE '%SEMTAC%';
UPDATE unidades SET rota = 'Rota 5' WHERE nome ILIKE '%SEMOB%';
UPDATE unidades SET rota = 'Rota 5' WHERE nome ILIKE '%HIFA%';

COMMIT;
