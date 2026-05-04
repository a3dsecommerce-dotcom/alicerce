-- SCRIPT: Inteligência de Rotas e Encarregados
BEGIN;

-- 1. Garantir que a tabela de configuração de rotas existe
CREATE TABLE IF NOT EXISTS config_rotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rota_nome TEXT UNIQUE NOT NULL,
    encarregado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    encarregado_nome TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Inicializar as 5 rotas se não existirem
INSERT INTO config_rotas (rota_nome)
VALUES ('Rota 1'), ('Rota 2'), ('Rota 3'), ('Rota 4'), ('Rota 5')
ON CONFLICT (rota_nome) DO NOTHING;

-- 3. Função para sincronizar encarregado_id na tabela unidades
-- Isso garante que quando mudamos o supervisor de uma ROTA, todas as UNIDADES dessa rota atualizam automaticamente
CREATE OR REPLACE FUNCTION sync_unidades_encarregado()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE unidades 
    SET encarregado_id = NEW.encarregado_id 
    WHERE rota = NEW.rota_nome;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para disparar a sincronização
DROP TRIGGER IF EXISTS trigger_sync_unidades_encarregado ON config_rotas;
CREATE TRIGGER trigger_sync_unidades_encarregado
AFTER UPDATE OF encarregado_id ON config_rotas
FOR EACH ROW
EXECUTE FUNCTION sync_unidades_encarregado();

-- 5. Sincronizar unidades existentes com os encarregados atuais das rotas
UPDATE unidades u
SET encarregado_id = cr.encarregado_id
FROM config_rotas cr
WHERE u.rota = cr.rota_nome;

COMMIT;
