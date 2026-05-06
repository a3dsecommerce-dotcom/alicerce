-- Tabela para armazenamento de denúncias anônimas (Canal de Ética)
CREATE TABLE IF NOT EXISTS denuncias_anonimas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    natureza TEXT NOT NULL,
    detalhamento TEXT NOT NULL,
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_ANALISE, CONCLUIDO, ARQUIVADO
    protocolo TEXT UNIQUE NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    unidade_concluidora TEXT,
    observacoes_gestao TEXT
);

-- Habilitar RLS
ALTER TABLE denuncias_anonimas ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem inserir (anônimo)
CREATE POLICY "Qualquer um pode inserir denúncias" ON denuncias_anonimas
    FOR INSERT WITH CHECK (true);

-- Política: Apenas ADMIN, DIRETORIA e GERENTE podem ver/editar
CREATE POLICY "Gestão pode ver denúncias" ON denuncias_anonimas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND (usuarios.nivel_acesso >= 3 OR usuarios.cargo ILIKE '%GERENTE%' OR usuarios.cargo ILIKE '%DIRETOR%')
        )
    );

CREATE POLICY "Gestão pode editar denúncias" ON denuncias_anonimas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND (usuarios.nivel_acesso >= 3 OR usuarios.cargo ILIKE '%GERENTE%' OR usuarios.cargo ILIKE '%DIRETOR%')
        )
    );
