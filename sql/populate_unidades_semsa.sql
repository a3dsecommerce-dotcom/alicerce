-- Inserção de Unidades da SEMSA (Saúde)
BEGIN;

INSERT INTO unidades (nome, endereco, bairro, secretaria) VALUES
('SEDE DA SEMSA', 'Av. Adamastor Antônio da Silva, 28', 'Muquiçaba', 'SEMSA'),
('AME - AMBULATORIO MUNICIPAL ESPECIALIZADO', NULL, 'Centro', 'SEMSA'),
('POSTO DE SAUDE TODOS OS SANTOS', NULL, 'Todos os Santos', 'SEMSA'),
('POSTO DE SAUDE RETA GRANDE', NULL, 'Reta Grande', 'SEMSA'),
('POSTO DE SAUDE SANTA MONICA', NULL, 'Santa Mônica', 'SEMSA'),
('UPA', 'R. Cachoeiro de Itapemirim, 120', 'Ipiranga', 'SEMSA'),
('POSTO DE SAUDE MARIO SERGIO', 'Av. Pres. Juscelino Kubitscheck de Oliveira, s/n', 'Kubitscheck', 'SEMSA'),
('POSTO DE SAÚDE ROBERTO CALMON', 'R. Antônio Cláudio Coutinho, s/n', 'Centro', 'SEMSA'),
('POSTO DE SAÚDE ARNALDO MAGALHAES', 'R. Antônio Lira Monjardim, s/n', 'Praia do Morro', 'SEMSA'),
('USF MARIA LUCIA', NULL, 'Muquiçaba', 'SEMSA'),
('POSTO DE SAÚDE RECANTO DA SEREIA', NULL, 'Recanto da Sereia', 'SEMSA'),
('USF NARBAL DE PAULA', NULL, 'Ipiranga', 'SEMSA'),
('SAÚDE DA MULHER', 'R. Alexandre Grande Ribeiro, 100', 'Muquiçaba', 'SEMSA'),
('CAPS 1', 'R. Pref. Epaminondas de Almeida, 598', 'Parque da Areia Preta', 'SEMSA'),
('TUBERCULOSE', NULL, 'Muquiçaba', 'SEMSA'),
('CENTRO MUNICIPAL DE SAÚDE', 'R. Emília Trindade da Silva, 146', 'Muquiçaba', 'SEMSA'),
('USF CAIC', NULL, 'Kubitscheck', 'SEMSA'),
('USF THEREZA LOYOLA DE JESUS', NULL, 'Praia do Morro', 'SEMSA'),
('USF PEDRO MACHADO', NULL, 'Itapebussu', 'SEMSA'),
('USF CAMURUGI', NULL, 'Camurugi', 'SEMSA'),
('USF MARLENE', NULL, 'Nossa Senhora da Conceição', 'SEMSA'),
('CTAHIFA DESATIVADO', 'R. Antônio Lira Monjardim, s/n', 'Praia do Morro', 'SEMSA'),
('ALMOXARIFADO DA FARMACIA POPULAR', NULL, 'Muquiçaba', 'SEMSA'),
('FARMACIA NO CENTRO ADMINISTRATIVO', 'Av. Paris, 686', 'Praia do Morro', 'SEMSA')
ON CONFLICT (nome) DO UPDATE SET endereco = EXCLUDED.endereco, bairro = EXCLUDED.bairro, secretaria = EXCLUDED.secretaria;

COMMIT;
