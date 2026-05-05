-- TABELA DE NOTIFICAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.usuarios(id), -- Destinatário específico (opcional)
    setor_destino TEXT, -- Setor destinatário (opcional)
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'danger'
    lida BOOLEAN DEFAULT FALSE,
    link TEXT, -- Link para o módulo/item relacionado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Notificações: Ver próprias ou do seu setor" ON public.notificacoes
FOR SELECT USING (
    user_id = auth.uid() OR 
    setor_destino = public.get_my_secretaria() OR
    (SELECT nivel_acesso FROM public.usuarios WHERE id = auth.uid()) >= 3
);

CREATE POLICY "Notificações: Marcar como lida" ON public.notificacoes
FOR UPDATE USING (user_id = auth.uid() OR (SELECT nivel_acesso FROM public.usuarios WHERE id = auth.uid()) >= 3);

CREATE POLICY "Notificações: Sistema insere" ON public.notificacoes
FOR INSERT WITH CHECK (true);
