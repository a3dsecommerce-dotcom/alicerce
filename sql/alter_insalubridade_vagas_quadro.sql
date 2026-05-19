-- =========================================================================
-- MIGRATION: Alteração da coluna insalubridade para TEXT
-- =========================================================================

-- Altera o tipo da coluna insalubridade de BOOLEAN para TEXT para comportar 'N/A', '20%', '40%'
ALTER TABLE vagas_quadro ALTER COLUMN insalubridade DROP DEFAULT;

ALTER TABLE vagas_quadro ALTER COLUMN insalubridade TYPE TEXT USING 
    CASE 
        WHEN insalubridade = TRUE THEN '20%'
        ELSE 'N/A'
    END;

ALTER TABLE vagas_quadro ALTER COLUMN insalubridade SET DEFAULT 'N/A';
