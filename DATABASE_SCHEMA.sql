-- SCHEMA MASTER - ALICERCE ERP (V752.5)
-- Este arquivo contém todas as tabelas necessárias para o funcionamento do portal.
-- Copie e cole este código no "SQL Editor" do seu Supabase Dashboard.

-- 1. TABELA DE USUÁRIOS (COLABORADORES E GESTORES)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE,
  email TEXT,
  cargo TEXT, -- ASG, Porteiro, Zelador, Encarregado, Gerente, Comprador, Almoxarife, Diretor, Admin
  unidade_alocacao TEXT,
  status TEXT DEFAULT 'ATIVO', -- ATIVO, INATIVO, AFASTADO
  data_admissao DATE,
  nivel_acesso INTEGER DEFAULT 1,
  cpf TEXT,
  rg TEXT,
  pis TEXT,
  insalubridade INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABELA DE CANDIDATOS (BANCO DE TALENTOS)
CREATE TABLE IF NOT EXISTS candidatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cargo TEXT,
  status TEXT DEFAULT 'TRIAGEM', -- TRIAGEM, ENTREVISTA, APROVADO, REPROVADO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  experiencia BOOLEAN DEFAULT FALSE,
  unidade_interesse TEXT,
  cep TEXT,
  rua TEXT,
  bairro TEXT,
  tamanho_uniforme TEXT
);

-- 3. TABELA DE AJUSTES DE PONTO (INTEGRAÇÃO WHATSAPP BOT)
CREATE TABLE IF NOT EXISTS ajustes_ponto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  data_referencia TEXT, -- ex: "22/04"
  motivo TEXT,
  resolvido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE PEDIDOS DE COMPRAS (SUPRIMENTOS)
CREATE TABLE IF NOT EXISTS compras_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  unidade TEXT,
  secretaria TEXT,
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_TRANSITO, ENTREGUE, FINALIZADO
  total_itens INTEGER DEFAULT 0,
  recebedor_nome TEXT,
  recebedor_cpf TEXT,
  data_entrega TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE ITENS DOS PEDIDOS
CREATE TABLE IF NOT EXISTS compras_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES compras_pedidos(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  qtd_pedida INTEGER NOT NULL,
  qtd_entregue INTEGER DEFAULT 0,
  obs TEXT
);

-- 6. TABELA DE ESTOQUE CENTRAL (ALMOXARIFADO)
CREATE TABLE IF NOT EXISTS estoque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item TEXT UNIQUE,
  quantidade INTEGER DEFAULT 0,
  categoria TEXT, -- EPI, LIMPEZA, ESCRITORIO
  minimo_alerta INTEGER DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. TABELA DE OCORRÊNCIAS E TICKETS
CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  unidade TEXT,
  tipo TEXT, -- FALTA, EPI_DANIFICADO, SOLICITACAO_VOLANTE, OUTROS
  descricao TEXT,
  status TEXT DEFAULT 'ABERTO', -- ABERTO, EM_ANALISE, RESOLVIDO
  prioridade TEXT DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, CRITICA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- HABILITAR RLS (OPCIONAL - DESATIVADO PARA FACILITAR INÍCIO)
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Acesso Total" ON usuarios FOR ALL USING (true);
