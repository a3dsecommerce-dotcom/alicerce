-- Inserir ou atualizar o usuário do RH SEMED no banco de dados do Alicerce CRM
-- Telefone: 5527981496286 (últimos 4 dígitos para a senha padrão: 6286)
-- Cargo: RH_SEMED (Permissão para acessar o módulo RH com filtro exclusivo para a SEMED)
-- Nível de Acesso: 3 (Nível Administrativo Geral)

INSERT INTO usuarios (
  nome, 
  telefone, 
  cargo, 
  nivel_acesso, 
  status, 
  data_admissao,
  secretaria
)
VALUES (
  'RH SEMED Alicerce', 
  '5527981496286', 
  'RH_SEMED', 
  3, 
  'ATIVO', 
  CURRENT_DATE,
  'SEMED'
)
ON CONFLICT (telefone) DO UPDATE
SET 
  nome = 'RH SEMED Alicerce', 
  cargo = 'RH_SEMED', 
  nivel_acesso = 3, 
  status = 'ATIVO',
  secretaria = 'SEMED',
  updated_at = NOW();
