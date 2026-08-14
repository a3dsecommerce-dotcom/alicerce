-- =====================================================================
-- ALIMENTAÇÃO DE COEFICIENTES BASE: Almoxarifado Suprimentos
-- Versão: v753.9.4
-- Executar em: Supabase SQL Editor
-- =====================================================================

-- Restaura primeiro todos para 1.00 por garantia
UPDATE almox_suprimentos SET coeficiente = 1.00;

-- Atualiza com base na lista de coeficientes oficiais da imagem
UPDATE almox_suprimentos SET coeficiente = 5.24 WHERE item ILIKE 'Papel higiênico em rolo 30mx10cm%';
UPDATE almox_suprimentos SET coeficiente = 1.18 WHERE item ILIKE 'Papel higiênico em rolão%';
UPDATE almox_suprimentos SET coeficiente = 9.06 WHERE item ILIKE 'Papel toalha interfolhado%';
UPDATE almox_suprimentos SET coeficiente = 1.12 WHERE item ILIKE 'Sabonete tipo gel - galão%';
UPDATE almox_suprimentos SET coeficiente = 0.08 WHERE item ILIKE 'Balde plástico extra forte%';
UPDATE almox_suprimentos SET coeficiente = 0.08 WHERE item ILIKE 'Disco para lavagem%';
UPDATE almox_suprimentos SET coeficiente = 0.02 WHERE item ILIKE 'Disco lustrador%';
UPDATE almox_suprimentos SET coeficiente = 0.06 WHERE item ILIKE 'Disco removedor%';
UPDATE almox_suprimentos SET coeficiente = 0.04 WHERE item ILIKE 'Desentupidor de vaso%';
UPDATE almox_suprimentos SET coeficiente = 0.05 WHERE item ILIKE 'Lixeira com tampa e pedal (25%';
UPDATE almox_suprimentos SET coeficiente = 0.09 WHERE item ILIKE 'Lixeira com tampa e pedal (100%';
UPDATE almox_suprimentos SET coeficiente = 0.02 WHERE item ILIKE 'Lixeira extra forte p/%';
UPDATE almox_suprimentos SET coeficiente = 0.05 WHERE item ILIKE 'Lixeira plástica telada%';
UPDATE almox_suprimentos SET coeficiente = 0.06 WHERE item ILIKE 'Pá de lixo plástico%';
UPDATE almox_suprimentos SET coeficiente = 0.07 WHERE item ILIKE 'Placa sinalizadora "PISO ESCORREGADIO"%';
UPDATE almox_suprimentos SET coeficiente = 0.12 WHERE item ILIKE 'Rodo c/ cabo de madeira plastificado 40cm%';
UPDATE almox_suprimentos SET coeficiente = 0.13 WHERE item ILIKE 'Rodo c/ cabo de madeira plastificado 60cm%';
UPDATE almox_suprimentos SET coeficiente = 0.12 WHERE item ILIKE 'Refil para rodo de 40cm%';
UPDATE almox_suprimentos SET coeficiente = 0.13 WHERE item ILIKE 'Refil para rodo de 60cm%';
UPDATE almox_suprimentos SET coeficiente = 0.13 WHERE item ILIKE 'Vassoura de pelo 30cm%';
UPDATE almox_suprimentos SET coeficiente = 0.04 WHERE item ILIKE 'Vassoura de pelo 60cm%';
UPDATE almox_suprimentos SET coeficiente = 0.13 WHERE item ILIKE 'Vassoura de piaçava n.º 03%' OR item ILIKE 'Vassoura de piaçava nº 03%';
UPDATE almox_suprimentos SET coeficiente = 0.06 WHERE item ILIKE 'Vassoura de piaçava n.º 05%' OR item ILIKE 'Vassoura de piaçava nº 05%';
UPDATE almox_suprimentos SET coeficiente = 0.09 WHERE item ILIKE 'Vassoura de teto%';
UPDATE almox_suprimentos SET coeficiente = 0.07 WHERE item ILIKE 'Vassourinha sanitária%';
UPDATE almox_suprimentos SET coeficiente = 3.35 WHERE item ILIKE 'Água sanitária%';
UPDATE almox_suprimentos SET coeficiente = 3.18 WHERE item ILIKE 'Álcool 70%%';
UPDATE almox_suprimentos SET coeficiente = 0.12 WHERE item ILIKE 'Aromatizante tipo Bom Ar%';
UPDATE almox_suprimentos SET coeficiente = 0.59 WHERE item ILIKE 'Cera líquida%INCOLOR%';
UPDATE almox_suprimentos SET coeficiente = 0.05 WHERE item ILIKE 'Cera líquida%VERMELHA%';
UPDATE almox_suprimentos SET coeficiente = 0.29 WHERE item ILIKE 'Cera líquida%VERDE%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Desinfetante líquido sanitizante%';
UPDATE almox_suprimentos SET coeficiente = 0.59 WHERE item ILIKE 'Desinfetante quaternário%';
UPDATE almox_suprimentos SET coeficiente = 0.01 WHERE item ILIKE 'Desengraxante%';
UPDATE almox_suprimentos SET coeficiente = 2.00 WHERE item ILIKE 'Desodorizador sanitário%';
UPDATE almox_suprimentos SET coeficiente = 1.54 WHERE item ILIKE 'Detergente neutro líquido (5%';
UPDATE almox_suprimentos SET coeficiente = 0.01 WHERE item ILIKE 'Detergente concentrado de baixa%';
UPDATE almox_suprimentos SET coeficiente = 0.01 WHERE item ILIKE 'Detergente neutro concentrado%';
UPDATE almox_suprimentos SET coeficiente = 0.17 WHERE item ILIKE 'Escova de mão%';
UPDATE almox_suprimentos SET coeficiente = 0.87 WHERE item ILIKE 'Esponja de aço%';
UPDATE almox_suprimentos SET coeficiente = 2.91 WHERE item ILIKE 'Esponja de fibra dupla%';
UPDATE almox_suprimentos SET coeficiente = 2.35 WHERE item ILIKE 'Flanela branca%';
UPDATE almox_suprimentos SET coeficiente = 0.71 WHERE item ILIKE 'Hipoclorito de sódio%';
UPDATE almox_suprimentos SET coeficiente = 0.08 WHERE item ILIKE 'Limpa inox%';
UPDATE almox_suprimentos SET coeficiente = 0.02 WHERE item ILIKE 'Limpa porcelanato%';
UPDATE almox_suprimentos SET coeficiente = 0.94 WHERE item ILIKE 'Limpa vidros%';
UPDATE almox_suprimentos SET coeficiente = 3.52 WHERE item ILIKE 'Limpador multiuso%';
UPDATE almox_suprimentos SET coeficiente = 0.29 WHERE item ILIKE 'Lustra móveis%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex azul tamanho: P%' OR item ILIKE 'Luva de látex azul%P%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex azul tamanho: M%' OR item ILIKE 'Luva de látex azul%M%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex azul tamanho: G%' OR item ILIKE 'Luva de látex azul%G%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex amarela%P%' OR item ILIKE 'Luva de látex amarela%P%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex amarela%M%' OR item ILIKE 'Luva de látex amarela%M%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Luva látex amarela%G%' OR item ILIKE 'Luva de látex amarela%G%';
UPDATE almox_suprimentos SET coeficiente = 0.12 WHERE item ILIKE 'Palha de aço%';
UPDATE almox_suprimentos SET coeficiente = 2.12 WHERE item ILIKE 'Pano de chão%';
UPDATE almox_suprimentos SET coeficiente = 0.12 WHERE item ILIKE 'Remover de cera%' OR item ILIKE 'Removedor de cera%';
UPDATE almox_suprimentos SET coeficiente = 1.08 WHERE item ILIKE 'Sabão em barra%';
UPDATE almox_suprimentos SET coeficiente = 1.12 WHERE item ILIKE 'Sabão em pó%';
UPDATE almox_suprimentos SET coeficiente = 19.18 WHERE item ILIKE 'Saco plástico branco leitoso - lixo infectante 100%';
UPDATE almox_suprimentos SET coeficiente = 19.53 WHERE item ILIKE 'Saco plástico branco leitoso - lixo infectante 50%';
UPDATE almox_suprimentos SET coeficiente = 3.00 WHERE item ILIKE 'Saco para lixo 100 litros preto%';
UPDATE almox_suprimentos SET coeficiente = 31.76 WHERE item ILIKE 'Saco para lixo 600 litros%';
UPDATE almox_suprimentos SET coeficiente = 15.88 WHERE item ILIKE 'Saco para lixo 40 litros%';
UPDATE almox_suprimentos SET coeficiente = 0.35 WHERE item ILIKE 'Sapólio%';
UPDATE almox_suprimentos SET coeficiente = 1.00 WHERE item ILIKE 'Fralda descartável%';
UPDATE almox_suprimentos SET coeficiente = 0.50 WHERE item ILIKE 'B. picotada 25x35%';
UPDATE almox_suprimentos SET coeficiente = 0.50 WHERE item ILIKE 'B. picotada 29x40%';
UPDATE almox_suprimentos SET coeficiente = 0.50 WHERE item ILIKE 'Touca descartável%';
UPDATE almox_suprimentos SET coeficiente = 0.60 WHERE item ILIKE 'Lenço umedecido%';
