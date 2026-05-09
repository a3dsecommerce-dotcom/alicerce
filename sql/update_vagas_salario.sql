-- Adiciona coluna de salário à tabela de quadro de vagas
ALTER TABLE vagas_quadro ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT 0;

-- Comentário
COMMENT ON COLUMN vagas_quadro.salario IS 'Salário base para o cargo nesta unidade';
