-- ============================================================
-- ALICERCE ERP - SISTEMA DE MISSÕES OPERACIONAIS (FASE 1)
-- ============================================================

-- 1. Tabela de Definição de Missões
CREATE TABLE IF NOT EXISTS missoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    frequencia TEXT CHECK (frequencia IN ('SEMANAL', 'MENSAL')),
    tipo TEXT DEFAULT 'GERAL', -- Pode ser 'EPI', 'DADOS', 'QUALIDADE'
    prazo_final TIMESTAMP WITH TIME ZONE,
    ativa BOOLEAN DEFAULT true,
    checklist JSONB DEFAULT '[]', -- Lista de tarefas ex: [{"task": "Conferir Botas", "type": "boolean"}]
    criado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de Respostas/Execução das Missões
CREATE TABLE IF NOT EXISTS missoes_respostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    missao_id UUID REFERENCES missoes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id), -- O Encarregado que executou
    respostas JSONB DEFAULT '{}', -- Respostas do checklist
    evidencia_url TEXT, -- Link de foto/comprovante se houver
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONCLUIDO')),
    observacoes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Garante que o encarregado só responda uma vez por missão (ou por ciclo se resetarmos)
    UNIQUE(missao_id, usuario_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE missoes_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas Simples (Ajustar conforme necessidade)
CREATE POLICY "Diretores podem tudo nas missões" ON missoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Todos podem ver missões" ON missoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Encarregados podem ver e responder suas missões" ON missoes_respostas FOR ALL TO authenticated USING (true);

-- Comentários:
-- O campo 'checklist' permite que cada missão tenha perguntas diferentes.
-- O campo 'respostas' armazena o que o encarregado marcou em campo.
