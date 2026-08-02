-- Inserir ou atualizar o usuário do SESMT no banco de dados do Alicerce CRM
-- Telefone: 553398759152 (últimos 4 dígitos para a senha padrão: 9152)
-- Cargo: TECNICO_SEGURANCA (Permissão para acessar o módulo SST)
-- Nível de Acesso: 3 (Nível Administrativo Geral)

INSERT INTO usuarios (
  nome, 
  telefone, 
  cargo, 
  nivel_acesso, 
  status, 
  data_admissao
)
VALUES (
  'SESMT Alicerce', 
  '553398759152', 
  'TECNICO_SEGURANCA', 
  3, 
  'ATIVO', 
  CURRENT_DATE
)
ON CONFLICT (telefone) DO UPDATE
SET 
  nome = 'SESMT Alicerce', 
  cargo = 'TECNICO_SEGURANCA', 
  nivel_acesso = 3, 
  status = 'ATIVO',
  updated_at = NOW();
