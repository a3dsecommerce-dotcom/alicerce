-- Tabela de Vínculo Estratégico: Unidades x Encarregados (Gestão de Rotas)
CREATE TABLE IF NOT EXISTS gestao_rotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidade_nome TEXT NOT NULL UNIQUE, -- Nome da unidade (ex: SEMED, SEMSA)
    encarregado_id UUID REFERENCES auth.users(id), -- ID do usuário (Auth)
    encarregado_nome TEXT, -- Cache do nome para performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilita RLS
ALTER TABLE gestao_rotas ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Acesso Total para Admin e Gerência" ON gestao_rotas
    FOR ALL USING (true);

COMMENT ON TABLE gestao_rotas IS 'Mapeamento oficial de unidades para encarregados responsáveis, definindo a hierarquia operacional do Alicerce ERP.';
