-- ==========================================================
-- 🏛️ SCHEMA MASTER SUPREME - ALICERCE ERP (V800.0)
-- 🏛️ ARQUITETURA DE DADOS PARA CONTROLE TOTAL E SOBERANO
-- ==========================================================
-- Instrução: Execute este script no SQL Editor do seu Supabase.
-- Ele criará todas as tabelas, triggers de auditoria e automações de log.

-- Habilitar Extensão para UUID se não existir
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. UNIDADES (SECRETARIAS E ÓRGÃOS PÚBLICOS)
CREATE TABLE IF NOT EXISTS unidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE, -- Ex: SEMED, SEMSA, PREFEITURA
  codigo TEXT, -- Ex: UN-001
  secretaria TEXT,
  total_efetivo INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. USUÁRIOS (COLABORADORES DIRETOS)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE,
  email TEXT,
  cpf TEXT UNIQUE,
  rg TEXT,
  pis TEXT,
  cargo TEXT, -- ASG, Porteiro, Zelador, Encarregado, Gerente, Comprador, Almoxarife, Diretor, Admin
  unidade_id UUID REFERENCES unidades(id),
  unidade_alocacao TEXT, -- Redundância para performance em filtros
  status TEXT DEFAULT 'ATIVO', -- ATIVO, INATIVO, AFASTADO
  data_admissao DATE,
  data_demissao DATE,
  nivel_acesso INTEGER DEFAULT 1,
  insalubridade INTEGER DEFAULT 0,
  meta_dados JSONB, -- Armazena dados flexíveis extras
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ARQUIVO MORTO (ESTRUTURA ESPELHO PARA EX-FUNCIONÁRIOS)
CREATE TABLE IF NOT EXISTS usuarios_arquivo_morto (
  id UUID PRIMARY KEY,
  nome TEXT,
  telefone TEXT,
  cpf TEXT,
  cargo TEXT,
  unidade_alocacao TEXT,
  data_admissao DATE,
  data_demissao DATE,
  motivo_desligamento TEXT,
  historico_json JSONB, -- Snapshots de performance do colaborador
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. USUÁRIOS ESPECIAIS (DIRETORES PMG, RH SECRETARIAS, COMPRADORES EXTERNOS)
-- Estes não são funcionários diretos, mas têm prioridade de gestão.
CREATE TABLE IF NOT EXISTS usuarios_especiais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo_cargo TEXT, -- Ex: Diretor de Unidade, Secretário, RH da Prefeitura
  telefone_whatsapp TEXT UNIQUE,
  vinculo_unidade UUID REFERENCES unidades(id),
  prioridade_nivel INTEGER DEFAULT 5, -- Nível 5 é máximo
  acesso_ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. CANAL DE ÉTICA E DENÚNCIAS
CREATE TABLE IF NOT EXISTS denuncias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo TEXT UNIQUE NOT NULL,
  anonimo BOOLEAN DEFAULT TRUE,
  denunciante_nome TEXT, -- Opcional se não for anônimo
  tipo_denuncia TEXT, -- Assédio, Desvio de Conduta, Segurança, Furto
  descricao TEXT NOT NULL,
  evidencias_urls TEXT[], -- Array de links de fotos/vídeos
  status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_INVESTIGACAO, RESOLVIDO, ARQUIVADO
  prioridade TEXT DEFAULT 'ALTA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. COBRANÇAS N8N (LOG DE AUTOMAÇÕES E RESOLUÇÃO DE PONTO)
CREATE TABLE IF NOT EXISTS historico_cobrancas_n8n (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  tipo_servico TEXT, -- PONTO, DOCUMENTACAO, REVISAO_EPI
  canal TEXT DEFAULT 'WHATSAPP',
  status_envio TEXT, -- ENVIADO, FALHA, RESPONDIDO
  mensagem_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. ABONOS E EXTRAS (CONTROLE DE JORNADA)
CREATE TABLE IF NOT EXISTS abonos_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  data_ocorrencia DATE NOT NULL,
  tipo TEXT, -- HORA_EXTRA, ABONO, FALTA_JUSTIFICADA, ATESTADO
  horas_quantidade DECIMAL(4,2),
  justificativa TEXT,
  aprovado_por UUID REFERENCES usuarios(id),
  status TEXT DEFAULT 'EM_ANALISE', -- EM_ANALISE, APROVADO, NEGADO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. SUPRIMENTOS E EPI (ALMOXARIFADO CENTRAL)
CREATE TABLE IF NOT EXISTS estoque_suprimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_item TEXT UNIQUE NOT NULL,
  categoria TEXT, -- EPI, LIMPEZA, ESCRITORIO, FERRAMENTAS
  quantidade_atual INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  unidade_medida TEXT DEFAULT 'UN', -- UN, KG, LITRO, PAR
  preco_estimado DECIMAL(10,2),
  last_restock TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. REQUISIÇÕES E ENTREGAS (LOGÍSTICA SECRETARIAS)
CREATE TABLE IF NOT EXISTS requisicoes_suprimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES unidades(id),
  solicitante_id UUID REFERENCES usuarios(id), -- Ou usuario_especial
  status TEXT DEFAULT 'ABERTO', -- ABERTO, SEPARACAO, EM_TRANSITO, ENTREGUE
  prioridade_entrega TEXT DEFAULT 'NORMAL',
  logistica_responsavel TEXT,
  recebedor_final TEXT, -- Nome de quem assinou na unidade
  data_entrega_real TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS requisicao_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requisicao_id UUID REFERENCES requisicoes_suprimentos(id) ON DELETE CASCADE,
  item_id UUID REFERENCES estoque_suprimentos(id),
  quantidade_solicitada INTEGER NOT NULL,
  quantidade_entregue INTEGER DEFAULT 0,
  observacao TEXT
);

-- 10. DISTRIBUIÇÃO DE EPI (INDIVIDUAL)
CREATE TABLE IF NOT EXISTS distribuicao_epi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  item_id UUID REFERENCES estoque_suprimentos(id),
  quantidade INTEGER DEFAULT 1,
  data_entrega DATE DEFAULT CURRENT_DATE,
  vencimento_ca DATE, -- Certificado de Aprovação
  assinatura_digital_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. LOGS DE SISTEMA (AUDITORIA TOTAL)
CREATE TABLE IF NOT EXISTS logs_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_acao TEXT, -- Nome ou ID do usuário que fez a alteração
  modulo TEXT, -- RH, SUPRIMENTOS, FINANCEIRO
  acao TEXT, -- INSERT, UPDATE, DELETE, LOGIN
  tabela_afetada TEXT,
  dados_antigos JSONB,
  dados_novos JSONB,
  motivo_alteracao TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. TICKETS E SLA (CENTRAL DE OCORRÊNCIAS)
CREATE TABLE IF NOT EXISTS tickets_sla (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo_ocorrencia TEXT, -- TECNICO, OPERACIONAL, ADMINISTRATIVO
  descricao TEXT,
  unidade_id UUID REFERENCES unidades(id),
  prioridade TEXT DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, CRITICA
  prazo_horas INTEGER DEFAULT 24, -- SLA definido
  status TEXT DEFAULT 'ABERTO', -- ABERTO, EM_PROGRESSO, RESOLVIDO, CANCELADO
  responsavel_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  finalizado_at TIMESTAMP WITH TIME ZONE
);

-- 13. CONTROLE DE LOGIN (OTP WHATSAPP)
CREATE TABLE IF NOT EXISTS login_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  codigo TEXT NOT NULL,
  expira_em TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '10 minutes'),
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- 🛠️ TRIGGERS DE AUTOMAÇÃO
-- ==========================================================

-- A. TRIGGER PARA ARQUIVO MORTO AUTOMÁTICO
CREATE OR REPLACE FUNCTION archive_user_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status = 'ATIVO' AND NEW.status = 'INATIVO') THEN
        INSERT INTO usuarios_arquivo_morto (id, nome, telefone, cpf, cargo, unidade_alocacao, data_admissao, data_demissao, motivo_desligamento)
        VALUES (OLD.id, OLD.nome, OLD.telefone, OLD.cpf, OLD.cargo, OLD.unidade_alocacao, OLD.data_admissao, CURRENT_DATE, 'Alterado via Sistema');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_user
AFTER UPDATE ON usuarios
FOR EACH ROW
WHEN (NEW.status = 'INATIVO')
EXECUTE FUNCTION archive_user_function();

-- B. TRIGGER PARA LOG DE AUDITORIA (EXEMPLO PARA TABELA USUARIOS)
CREATE OR REPLACE FUNCTION audit_log_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs_sistema (usuario_acao, modulo, acao, tabela_afetada, dados_antigos, dados_novos)
    VALUES (current_setting('app.current_user_name', true), 'SISTEMA', TG_OP, TG_TABLE_NAME, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Habilitar log na tabela usuarios
CREATE TRIGGER trigger_audit_usuarios
AFTER UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION audit_log_function();

-- ==========================================================
-- ✅ FIM DO SCHEMA MASTER V800.0
-- ==========================================================
