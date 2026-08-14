-- =====================================================================
-- MIGRAÇÃO: Almoxarifado — Configuração de Redução de Coeficiente Contínua
-- Versão: v753.9.3
-- Executar em: Supabase SQL Editor
-- =====================================================================

CREATE TABLE IF NOT EXISTS almox_configuracao (
    id TEXT PRIMARY KEY DEFAULT 'config_global',
    percentual_reducao DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (percentual_reducao BETWEEN 0 AND 100),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_por TEXT
);

-- Insere o registro padrão inicial se não existir
INSERT INTO almox_configuracao (id, percentual_reducao) 
VALUES ('config_global', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura e escrita por RLS
ALTER TABLE almox_configuracao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura global config" ON almox_configuracao FOR SELECT USING (true);
CREATE POLICY "Admin config" ON almox_configuracao FOR ALL USING (true);
