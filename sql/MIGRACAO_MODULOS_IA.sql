-- alicerce-crm/sql/MIGRACAO_MODULOS_IA.sql
-- 1. Criar Tabela de Chamados e Interações (DM)
CREATE TABLE IF NOT EXISTS public.chamados_interacoes (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    colaborador_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
    categoria text NOT NULL CHECK (categoria IN ('Atestado', 'Uniforme/EPI', 'Escala', 'Emergência')),
    descricao_demanda text NOT NULL,
    status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Resolvido')),
    data_resolucao timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chamados_colaborador ON public.chamados_interacoes(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON public.chamados_interacoes(status);

-- 2. Criar Tabela de Mensagens de Grupos (Raw)
CREATE TABLE IF NOT EXISTS public.historico_grupos_raw (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    group_id text NOT NULL,
    group_name text,
    sender_phone text NOT NULL,
    sender_name text,
    message_text text NOT NULL,
    processed boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_historico_grupos_processed ON public.historico_grupos_raw(processed);
CREATE INDEX IF NOT EXISTS idx_historico_grupos_phone ON public.historico_grupos_raw(sender_phone);
CREATE INDEX IF NOT EXISTS idx_historico_grupos_id ON public.historico_grupos_raw(group_id);

-- 3. Criar Tabela de Ocorrências de Campo extraídas
CREATE TABLE IF NOT EXISTS public.ocorrencias_campo (
    id bigserial PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    posto_afetado text NOT NULL,
    categoria text NOT NULL CHECK (categoria IN ('Falta/Atraso', 'Infraestrutura', 'Insumos', 'Incidente')),
    gravidade text NOT NULL CHECK (gravidade IN ('Baixa', 'Média', 'Alta', 'Crítica')),
    descricao_fato text NOT NULL,
    trecho_original text NOT NULL,
    resolvido boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_campo_resolvido ON public.ocorrencias_campo(resolvido);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_campo_categoria ON public.ocorrencias_campo(categoria);
