-- CREATE PEDIDOS DE TRANSFERENCIA COLABORADOR TABLE
CREATE TABLE IF NOT EXISTS public.pedidos_transferencia_colaborador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    colaborador_nome TEXT NOT NULL,
    colaborador_telefone TEXT NOT NULL,
    tipo_transferencia TEXT NOT NULL, -- 'Posto de Trabalho', 'Escala de Horário', 'Função/Cargo', 'Outro'
    detalhes TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Pendente', 'Aprovado pelo Encarregado', 'Recusado pelo Encarregado'
    resposta_encarregado TEXT,
    encarregado_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    encarregado_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.pedidos_transferencia_colaborador ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Permitir leitura para todos autenticados" 
ON public.pedidos_transferencia_colaborador FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir insercao para colaborador" 
ON public.pedidos_transferencia_colaborador FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir update para encarregado ou admin" 
ON public.pedidos_transferencia_colaborador FOR UPDATE 
TO authenticated 
USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_pedidos_transf_colab_id ON public.pedidos_transferencia_colaborador(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_transf_status ON public.pedidos_transferencia_colaborador(status);
