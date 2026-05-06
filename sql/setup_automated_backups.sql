-- ============================================================
-- ALICERCE ERP - SISTEMA DE BACKUP AUTOMATIZADO (via pg_cron)
-- ============================================================
-- Este script configura a automação de snapshots diários das 
-- tabelas críticas no schema 'backups'.
-- ============================================================

-- 1. Habilitar extensão pg_cron (se ainda não estiver ativa)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar schema dedicado para backups
CREATE SCHEMA IF NOT EXISTS backups;

-- 3. Função para realizar o snapshot das tabelas
CREATE OR REPLACE FUNCTION backups.executar_snapshot_diario()
RETURNS void AS $$
DECLARE
    tabela_nome text;
    tabelas_para_backup text[] := ARRAY[
        'usuarios', 
        'catalogo_suprimentos', 
        'compras_itens', 
        'unidades',
        'escala_volantes',
        'informativos_operacionais'
    ];
    timestamp_suffix text := to_char(now(), 'YYYY_MM_DD');
BEGIN
    -- Loop pelas tabelas críticas
    FOREACH tabela_nome IN ARRAY tabelas_para_backup LOOP
        -- Verificar se a tabela de origem existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tabela_nome) THEN
            -- Criar snapshot (Clona dados e estrutura)
            EXECUTE format('DROP TABLE IF EXISTS backups.%I_%s', tabela_nome, timestamp_suffix);
            EXECUTE format('CREATE TABLE backups.%I_%s AS SELECT * FROM public.%I', tabela_nome, timestamp_suffix, tabela_nome);
            
            -- Log da operação (opcional, se houver tabela de log)
            RAISE NOTICE 'Backup da tabela % realizado com sucesso.', tabela_nome;
        END IF;
    END LOOP;

    -- Limpeza: Remover backups com mais de 7 dias para economizar espaço
    -- (Opcional: ajuste conforme a necessidade de retenção)
    FOREACH tabela_nome IN ARRAY tabelas_para_backup LOOP
        EXECUTE format('DROP TABLE IF EXISTS backups.%I_%s', tabela_nome, to_char(now() - interval '7 days', 'YYYY_MM_DD'));
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Agendar a tarefa para rodar todos os dias às 03:00 da manhã
-- O cron usa o formato: 'minuto hora dia mes dia_da_semana'
SELECT cron.schedule(
    'backup-diario-alicerce',  -- nome da tarefa
    '0 3 * * *',               -- todos os dias às 03:00
    'SELECT backups.executar_snapshot_diario();'
);

-- Comentários de uso:
-- Para rodar manualmente agora: SELECT backups.executar_snapshot_diario();
-- Para ver as tarefas agendadas: SELECT * FROM cron.job;
-- Para ver o log de execuções: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
