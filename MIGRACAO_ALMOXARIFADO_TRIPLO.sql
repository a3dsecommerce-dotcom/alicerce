-- =================================================================================
-- REESTRUTURAÇÃO DO ALMOXARIFADO (TRÊS TABELAS DISTINTAS)
-- =================================================================================

-- 1. Tabela de EPIs (Gestão de Estoque Próprio e SST)
CREATE TABLE IF NOT EXISTS almox_epi (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_registro TEXT,
    item TEXT NOT NULL,
    categoria TEXT DEFAULT 'EPI',
    unidade_medida TEXT DEFAULT 'UN',
    tamanho TEXT,
    ca TEXT,
    quantidade INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Suprimentos (Catálogo de Compras / Acompanhamento)
CREATE TABLE IF NOT EXISTS almox_suprimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_registro TEXT,
    item TEXT NOT NULL,
    categoria TEXT DEFAULT 'SUPRIMENTO',
    unidade_medida TEXT DEFAULT 'UN',
    tamanho TEXT,
    valor_unitario NUMERIC DEFAULT 0,
    coeficiente DECIMAL(10,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Escritório (Estoque Interno de Uso Diário)
CREATE TABLE IF NOT EXISTS almox_escritorio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_registro TEXT,
    item TEXT NOT NULL,
    categoria TEXT DEFAULT 'ESCRITORIO',
    unidade_medida TEXT DEFAULT 'UN',
    tamanho TEXT,
    quantidade INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Ajuste na tabela de Requisições para suportar as novas tabelas
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS tipo_item TEXT; -- 'EPI', 'SUPRIMENTO', 'ESCRITORIO'
ALTER TABLE requisicoes DROP CONSTRAINT IF EXISTS requisicoes_item_id_fkey; -- Remove FK fixa para permitir IDs de tabelas diferentes

-- Migração Básica (Opcional, caso já existam dados no estoque_atual)
INSERT INTO almox_epi (id, item, categoria, unidade_medida, tamanho, ca, quantidade, estoque_minimo, codigo_registro)
SELECT id, item, categoria, unidade_medida, tamanho, ca, quantidade, estoque_minimo, codigo_registro 
FROM estoque_atual WHERE tipo_estoque = 'PROPRIO' AND categoria = 'EPI'
ON CONFLICT DO NOTHING;

INSERT INTO almox_suprimentos (id, item, categoria, unidade_medida, tamanho, valor_unitario, coeficiente, codigo_registro)
SELECT id, item, categoria, unidade_medida, tamanho, valor_unitario, coeficiente, codigo_registro 
FROM estoque_atual WHERE tipo_estoque = 'CATALOGO' OR categoria = 'SUPRIMENTO'
ON CONFLICT DO NOTHING;
