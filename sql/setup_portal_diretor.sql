-- SQL PARA IMPLEMENTAÇÃO DO PORTAL DO DIRETOR (FISCAL DO CONTRATANTE)
-- Versão: v753.7
-- Objetivo: Vincular diretores externos às suas unidades e permitir gestão de horários e ocorrências.

-- 1. Extensão da tabela de UNIDADES para vincular o Diretor
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS diretor_id UUID REFERENCES usuarios(id);
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS observacoes_fiscal TEXT;

-- 2. Extensão da tabela de USUÁRIOS para suportar horário de trabalho e vontades
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_trabalho TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS vontades_pendentes TEXT; -- Campo para o Diretor registrar necessidades

-- 3. Criação da tabela de Ocorrências Diretas do Diretor (Feedback do Cliente)
CREATE TABLE IF NOT EXISTS feedback_diretor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES unidades(id),
    diretor_id UUID REFERENCES usuarios(id),
    colaborador_id UUID REFERENCES usuarios(id),
    tipo_feedback TEXT, -- FALTA, ATRASO, CONDUTA, ELOGIO, OUTROS
    descricao TEXT,
    urgencia TEXT DEFAULT 'NORMAL', -- NORMAL, URGENTE, CRITICO
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, EM_ANALISE, RESOLVIDO, ARQUIVADO
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS para Segurança do Cliente (O Diretor só vê a sua Unidade)
ALTER TABLE feedback_diretor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diretores veem apenas feedbacks da sua unidade" ON feedback_diretor
    FOR SELECT USING (
        diretor_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND nivel_acesso >= 3)
    );

CREATE POLICY "Diretores inserem feedbacks" ON feedback_diretor
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Atualização de Comentários para Documentação
COMMENT ON COLUMN unidades.diretor_id IS 'ID do usuário (nível 5) que atua como fiscal do contratante nesta unidade.';
COMMENT ON COLUMN usuarios.horario_trabalho IS 'Horário de jornada definido para o posto, editável pelo Diretor da Unidade.';
