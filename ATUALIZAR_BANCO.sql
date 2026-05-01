-- =================================================================================
-- CRIAÇÃO DA TABELA DE CANDIDATOS (TRIAGEM RH)
-- Execute este comando no SQL Editor do seu Supabase
-- =================================================================================

CREATE TABLE IF NOT EXISTS candidatos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    pis TEXT,
    titulo_eleitor TEXT,
    telefone TEXT NOT NULL,
    email TEXT,
    data_nascimento DATE,
    cargo_pretendido TEXT,
    
    -- Endereço Completo
    cep TEXT,
    rua TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'Manaus',
    estado TEXT DEFAULT 'AM',
    
    -- Uniforme e SST
    tamanho_camisa TEXT, 
    tamanho_calca TEXT, 
    tamanho_calcado INTEGER, 
    
    -- Perfil Profissional
    experiencia_previa BOOLEAN DEFAULT FALSE,
    ultimo_emprego TEXT,
    escolaridade TEXT, 
    
    -- Status da Triagem
    status_candidato TEXT DEFAULT 'NOVO', 
    observacoes_rh TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS candidatos_cpf_idx ON candidatos(cpf);
CREATE INDEX IF NOT EXISTS candidatos_status_idx ON candidatos(status_candidato);

-- =================================================================================
-- TABELA DE USUÁRIOS (PORTAL E ACESSO)
-- =================================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT UNIQUE NOT NULL,
    email TEXT,
    cargo TEXT,
    unidade_alocacao TEXT,
    nivel_acesso INTEGER DEFAULT 1, -- 1: Operacional, 2: Supervisor, 3: Gestor, 4: Admin
    status TEXT DEFAULT 'ATIVO',
    data_admissao DATE,
    insalubridade INTEGER DEFAULT 0,
    salario_base DECIMAL(10,2),
    valor_alimentacao DECIMAL(10,2),
    valor_vale_transporte DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =================================================================================
-- TABELA DE UNIDADES (POSTOS DE TRABALHO)
-- =================================================================================
CREATE TABLE IF NOT EXISTS unidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    cidade TEXT DEFAULT 'Manaus',
    responsavel TEXT,
    telefone_contato TEXT,
    status TEXT DEFAULT 'ATIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =================================================================================
-- TABELA DE TICKETS E OCORRÊNCIAS (SLA)
-- =================================================================================
CREATE TABLE IF NOT EXISTS tickets_sla (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assunto TEXT NOT NULL,
    unidade TEXT,
    descricao TEXT,
    prioridade TEXT DEFAULT 'NORMAL',
    status TEXT DEFAULT 'PENDENTE',
    criado_por TEXT,
    atribuido_a TEXT,
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data_recebimento TIMESTAMP WITH TIME ZONE,
    data_fechamento TIMESTAMP WITH TIME ZONE,
    prazo_estipulado_dias INTEGER DEFAULT 1,
    prazo_prometido TIMESTAMP WITH TIME ZONE,
    solucao_descricao TEXT
);

-- =================================================================================
-- TABELA DE ESTOQUE (ALMOXARIFADO)
-- =================================================================================
CREATE TABLE IF NOT EXISTS estoque_atual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item TEXT NOT NULL,
    categoria TEXT,
    quantidade INTEGER DEFAULT 0,
    unidade_medida TEXT DEFAULT 'UN',
    estoque_minimo INTEGER DEFAULT 5,
    last_restock TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE estoque_atual ADD COLUMN IF NOT EXISTS tipo_estoque TEXT DEFAULT 'PROPRIO';
ALTER TABLE estoque_atual ADD COLUMN IF NOT EXISTS ca TEXT;
ALTER TABLE estoque_atual ADD COLUMN IF NOT EXISTS tamanho TEXT;
ALTER TABLE estoque_atual ADD COLUMN IF NOT EXISTS coeficiente DECIMAL(10,2) DEFAULT 1.0;

-- =================================================================================
-- TABELA DE REQUISIÇÕES (PEDIDOS)
-- =================================================================================
CREATE TABLE IF NOT EXISTS requisicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES estoque_atual(id),
    item_nome TEXT, -- nome do item para quando não há FK
    solicitante TEXT,
    unidade_destino TEXT,
    quantidade INTEGER NOT NULL,
    unidade_medida TEXT DEFAULT 'UN',
    status TEXT DEFAULT 'SOLICITADO', -- SOLICITADO, EM_ROTA, ENTREGUE
    data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Adiciona colunas faltantes se a tabela já existir
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS protocolo TEXT;
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS quantidade_aprovada INTEGER;
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP WITH TIME ZONE;
ALTER TABLE requisicoes ADD COLUMN IF NOT EXISTS recebedor_nome TEXT;

-- =================================================================================
-- TABELA DE PROCESSOS DE COMPRAS (TRACKING DE REMESSAS)
-- =================================================================================
CREATE TABLE IF NOT EXISTS compras_processos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nf TEXT,
    descricao TEXT,
    solicitado INTEGER DEFAULT 0,
    chegou INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_ROTA, CONCLUIDO
    recebedor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =================================================================================
-- TABELA DE AUDITORIA (LOGS DE GESTÃO)
-- =================================================================================
CREATE TABLE IF NOT EXISTS historico_gestao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    executor_tel TEXT,
    alvo_tel TEXT,
    tipo_acao TEXT, -- EDICAO_DADOS, REPOSICAO_ESTOQUE, ALTERACAO_STATUS
    de JSONB,
    para JSONB,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =================================================================================
-- TABELA DE PONTO DIGITAL
-- =================================================================================
CREATE TABLE IF NOT EXISTS ponto_digital (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefone TEXT NOT NULL,
    data DATE DEFAULT CURRENT_DATE,
    entrada_1 TIME,
    saida_1 TIME,
    entrada_2 TIME,
    saida_2 TIME,
    geolocalizacao JSONB,
    status_dia TEXT DEFAULT 'NORMAL', -- NORMAL, FALTA, ATESTADO, FERIADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
