-- =====================================================================
-- MIGRAÇÃO: Almoxarifado — Coeficientes, Preços, Acesso e Notas Fiscais
-- Versão: v753.9.0
-- Executar em: Supabase SQL Editor
-- =====================================================================

-- 1. PREÇO UNITÁRIO nas 3 tabelas de estoque
ALTER TABLE almox_suprimentos ADD COLUMN IF NOT EXISTS preco_unitario DECIMAL(10,2) DEFAULT 0;
ALTER TABLE almox_epi         ADD COLUMN IF NOT EXISTS preco_unitario DECIMAL(10,2) DEFAULT 0;
ALTER TABLE almox_escritorio  ADD COLUMN IF NOT EXISTS preco_unitario DECIMAL(10,2) DEFAULT 0;

-- 2. COEFICIENTE — apenas em suprimentos (fator que multiplica a cota ASG)
ALTER TABLE almox_suprimentos ADD COLUMN IF NOT EXISTS coeficiente DECIMAL(5,2) DEFAULT 1.00;

-- 3. SECRETARIAS PERMITIDAS — controle de acesso por item
ALTER TABLE almox_suprimentos ADD COLUMN IF NOT EXISTS secretarias_permitidas TEXT[] DEFAULT '{}';
ALTER TABLE almox_epi         ADD COLUMN IF NOT EXISTS secretarias_permitidas TEXT[] DEFAULT '{}';
ALTER TABLE almox_escritorio  ADD COLUMN IF NOT EXISTS secretarias_permitidas TEXT[] DEFAULT '{}';

-- 4. TABELA DE SECRETARIAS (cadastro livre)
CREATE TABLE IF NOT EXISTS almox_secretarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    sigla TEXT NOT NULL UNIQUE,
    ativa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir secretarias base (podem ser adicionadas mais pelo usuário)
INSERT INTO almox_secretarias (nome, sigla) VALUES
    ('Secretaria Municipal de Educação', 'SEMED'),
    ('Secretaria Municipal de Saúde', 'SEMSA'),
    ('Secretaria Municipal de Transporte', 'SEMTAC'),
    ('Secretaria Municipal de Administração', 'SEMAD'),
    ('Secretaria Municipal de Obras', 'SEMOB'),
    ('Secretaria Municipal de Meio Ambiente', 'SEMA'),
    ('Almoxarifado Central', 'ALMOX')
ON CONFLICT (sigla) DO NOTHING;

-- 5. TABELA DE METAS DE REDUÇÃO GLOBAL (por mês/ano)
CREATE TABLE IF NOT EXISTS almox_metas_reducao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    percentual_reducao DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (percentual_reducao BETWEEN 0 AND 100),
    aplicado_em TIMESTAMPTZ DEFAULT NOW(),
    aplicado_por TEXT,
    observacao TEXT,
    UNIQUE(mes, ano)
);

-- 6. TABELA DE NOTAS FISCAIS DE REQUISIÇÕES (valor real pago)
CREATE TABLE IF NOT EXISTS almox_notas_requisicao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo TEXT NOT NULL,
    secretaria TEXT NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    valor_nota DECIMAL(12,2) NOT NULL CHECK (valor_nota >= 0),
    numero_nf TEXT,
    fornecedor TEXT,
    observacao TEXT,
    lancado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notas_mes_ano ON almox_notas_requisicao(mes, ano);
CREATE INDEX IF NOT EXISTS idx_notas_secretaria ON almox_notas_requisicao(secretaria);
CREATE INDEX IF NOT EXISTS idx_notas_protocolo ON almox_notas_requisicao(protocolo);

-- 7. RLS — permitir operações nas novas tabelas
ALTER TABLE almox_secretarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE almox_metas_reducao ENABLE ROW LEVEL SECURITY;
ALTER TABLE almox_notas_requisicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura global secretarias" ON almox_secretarias FOR SELECT USING (true);
CREATE POLICY "Admin secretarias" ON almox_secretarias FOR ALL USING (true);

CREATE POLICY "Leitura global metas" ON almox_metas_reducao FOR SELECT USING (true);
CREATE POLICY "Admin metas" ON almox_metas_reducao FOR ALL USING (true);

CREATE POLICY "Leitura global notas" ON almox_notas_requisicao FOR SELECT USING (true);
CREATE POLICY "Admin notas" ON almox_notas_requisicao FOR ALL USING (true);
