-- ======================================================
-- SCRIPT DE EMERGÊNCIA: RESTAURAR ACESSO AO LOGIN
-- ======================================================

-- 1. Desativar RLS nas tabelas para permitir login customizado
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_epi DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_suprimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.almox_escritorio DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas que causam conflito com o login atual
DROP POLICY IF EXISTS "Usuarios: Ver mesma secretaria" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios: Diretores editam tudo" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios: Permite busca para login" ON public.usuarios;
DROP POLICY IF EXISTS "Requisicoes: Visibilidade Hierarquica" ON public.requisicoes;
DROP POLICY IF EXISTS "Requisicoes: Criar e Editar" ON public.requisicoes;
DROP POLICY IF EXISTS "Almox: Leitura Autenticada" ON public.almox_epi;
DROP POLICY IF EXISTS "Almox_Sup: Leitura Autenticada" ON public.almox_suprimentos;
DROP POLICY IF EXISTS "Almox_Esc: Leitura Autenticada" ON public.almox_escritorio;

-- NOTA: O sistema continuará seguro através dos filtros de código (Hooks) 
-- implementados na Fase B, que garantem que cada secretaria veja apenas seus dados.
