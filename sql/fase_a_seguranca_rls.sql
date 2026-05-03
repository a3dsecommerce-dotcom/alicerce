-- ==========================================
-- FASE A: BLINDAGEM DE SEGURANÇA (RLS)
-- ==========================================

-- 1. FUNÇÕES AUXILIARES PARA PERFORMANCE
-- Estas funções evitam subqueries repetitivas nas políticas de RLS.

CREATE OR REPLACE FUNCTION public.get_my_secretaria()
RETURNS TEXT AS $$
  SELECT secretaria FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_unidade()
RETURNS TEXT AS $$
  SELECT unidade_alocacao FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_nivel()
RETURNS INTEGER AS $$
  SELECT nivel_acesso FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. HABILITAR RLS NAS TABELAS CRÍTICAS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_epi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_suprimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_escritorio ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA A TABELA 'usuarios'
DROP POLICY IF EXISTS "Usuarios: Ver mesma secretaria" ON public.usuarios;
CREATE POLICY "Usuarios: Ver mesma secretaria" ON public.usuarios
FOR SELECT USING (
  nivel_acesso >= 3 OR -- Diretores veem tudo
  secretaria = public.get_my_secretaria() OR -- Mesma secretaria
  id = auth.uid() -- Próprio usuário
);

DROP POLICY IF EXISTS "Usuarios: Diretores editam tudo" ON public.usuarios;
CREATE POLICY "Usuarios: Diretores editam tudo" ON public.usuarios
FOR ALL USING (
  nivel_acesso >= 3 OR id = auth.uid()
);

-- 4. POLÍTICAS PARA A TABELA 'requisicoes'
DROP POLICY IF EXISTS "Requisicoes: Visibilidade Hierarquica" ON public.requisicoes;
CREATE POLICY "Requisicoes: Visibilidade Hierarquica" ON public.requisicoes
FOR SELECT USING (
  public.get_my_nivel() >= 3 OR -- Diretores
  (public.get_my_secretaria() = secretaria_destino) OR -- Compradores/Membros da Secretaria
  (public.get_my_unidade() = unidade_destino) -- Membros da Unidade
);

DROP POLICY IF EXISTS "Requisicoes: Criar e Editar" ON public.requisicoes;
CREATE POLICY "Requisicoes: Criar e Editar" ON public.requisicoes
FOR ALL USING (
  public.get_my_nivel() >= 3 OR -- Diretores
  (public.get_my_unidade() = unidade_destino) -- Solicitantes da Unidade
);

-- 5. POLÍTICAS PARA TABELAS DE ALMOXARIFADO (LEITURA GERAL, ESCRITA RESTRITA)
DROP POLICY IF EXISTS "Almox: Leitura Autenticada" ON public.almox_epi;
CREATE POLICY "Almox: Leitura Autenticada" ON public.almox_epi FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Almox: Escrita Diretores" ON public.almox_epi;
CREATE POLICY "Almox: Escrita Diretores" ON public.almox_epi FOR ALL USING (public.get_my_nivel() >= 3);

-- Repetir para suprimentos e escritorio
DROP POLICY IF EXISTS "Almox_Sup: Leitura Autenticada" ON public.almox_suprimentos;
CREATE POLICY "Almox_Sup: Leitura Autenticada" ON public.almox_suprimentos FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Almox_Sup: Escrita Diretores" ON public.almox_suprimentos;
CREATE POLICY "Almox_Sup: Escrita Diretores" ON public.almox_suprimentos FOR ALL USING (public.get_my_nivel() >= 3);

DROP POLICY IF EXISTS "Almox_Esc: Leitura Autenticada" ON public.almox_escritorio;
CREATE POLICY "Almox_Esc: Leitura Autenticada" ON public.almox_escritorio FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Almox_Esc: Escrita Diretores" ON public.almox_escritorio;
CREATE POLICY "Almox_Esc: Escrita Diretores" ON public.almox_escritorio FOR ALL USING (public.get_my_nivel() >= 3);
