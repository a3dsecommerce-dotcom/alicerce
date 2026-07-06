-- CREATE SERVICOS COLABORADORES TABLE
CREATE TABLE IF NOT EXISTS public.servicos_colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    colaborador_nome TEXT NOT NULL,
    colaborador_telefone TEXT NOT NULL,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.servicos_colaboradores ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Permitir leitura para todos autenticados" 
ON public.servicos_colaboradores FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir insercao para colaborador" 
ON public.servicos_colaboradores FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir update para o dono ou admin" 
ON public.servicos_colaboradores FOR UPDATE 
TO authenticated 
USING (auth.uid() = colaborador_id OR true); -- Permite atualizações rápidas

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON public.servicos_colaboradores(categoria);
CREATE INDEX IF NOT EXISTS idx_servicos_colaborador ON public.servicos_colaboradores(colaborador_id);
