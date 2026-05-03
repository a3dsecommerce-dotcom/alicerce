-- Tabela de Configuração de Rotas: Vínculo Rota x Supervisor
CREATE TABLE IF NOT EXISTS config_rotas (
    id SERIAL PRIMARY KEY,
    rota_nome TEXT NOT NULL UNIQUE, -- ROTA 1, ROTA 2, etc.
    encarregado_id UUID REFERENCES usuarios(id),
    encarregado_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE config_rotas ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Acesso Total para Admin e Gerência)
CREATE POLICY "Acesso Total para Admin e Gerência" ON config_rotas
    FOR ALL USING (true);

COMMENT ON TABLE config_rotas IS 'Mapeamento dinâmico de supervisores (Encarregados Nível 2) para as rotas fixas do sistema.';

-- Inserir as 5 rotas padrão caso não existam
INSERT INTO config_rotas (rota_nome) VALUES ('ROTA 1'), ('ROTA 2'), ('ROTA 3'), ('ROTA 4'), ('ROTA 5')
ON CONFLICT (rota_nome) DO NOTHING;
