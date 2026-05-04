-- SCRIPT: Organização de Unidades por Rota (Rota 5)
BEGIN;

-- 1. Garantir que a coluna rota existe
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS rota TEXT;

-- 2. Atualizar as unidades da Rota 5
UPDATE unidades SET rota = 'Rota 5' 
WHERE nome IN (
    'USF PEDRO MACHADO',
    'USF CAMURUGI'
);

COMMIT;
