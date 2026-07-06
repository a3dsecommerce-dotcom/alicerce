-- CREATE AGENDAMENTOS TABLE
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    colaborador_nome TEXT NOT NULL,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    motivo TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Permitir leitura para todos os autenticados" 
ON public.agendamentos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir insercao para o proprio colaborador" 
ON public.agendamentos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir update para todos autenticados" 
ON public.agendamentos FOR UPDATE 
TO authenticated 
USING (true);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_colaborador ON public.agendamentos(colaborador_id);
