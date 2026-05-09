-- Alteração da coluna insalubridade de BOOLEAN para TEXT para suportar porcentagens (N/A, 20%, 40%)
ALTER TABLE vagas_quadro ALTER COLUMN insalubridade TYPE TEXT USING (
    CASE 
        WHEN insalubridade = TRUE THEN '20%' 
        ELSE 'N/A' 
    END
);

-- Atualização do padrão
ALTER TABLE vagas_quadro ALTER COLUMN insalubridade SET DEFAULT 'N/A';
