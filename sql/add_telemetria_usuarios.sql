-- Script para implementar Telemetria de Acesso e Presença Online
-- Executar no Console SQL do Supabase

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS acessos_totais INTEGER DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultima_presenca TIMESTAMP WITH TIME ZONE;

-- Comentário para auditoria
COMMENT ON COLUMN usuarios.acessos_totais IS 'Contador incremental de sessões do usuário';
COMMENT ON COLUMN usuarios.ultima_presenca IS 'Timestamp do último heartbeat para detecção de usuários online';
