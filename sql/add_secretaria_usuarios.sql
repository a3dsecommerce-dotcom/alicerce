-- ADICIONA CAMPO DE SECRETARIA AO USUÁRIO SE NÃO EXISTIR
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS secretaria TEXT;
COMMENT ON COLUMN public.usuarios.secretaria IS 'Secretaria/Setor vinculado ao usuário para notificações (Ex: SEMED, SEMSA)';
