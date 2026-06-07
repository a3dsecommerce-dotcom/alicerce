-- Tabela de Configurações de Regularização de Ponto
CREATE TABLE IF NOT EXISTS config_ponto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE config_ponto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver configurações" ON config_ponto
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Nível 2+ pode atualizar configurações" ON config_ponto
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE id = auth.uid() AND nivel >= 2
        )
    );

-- Inserção de Horários Padrão
INSERT INTO config_ponto (chave, valor) 
VALUES ('horarios_cobranca', '["08:00", "14:00", "18:00"]')
ON CONFLICT (chave) DO NOTHING;
