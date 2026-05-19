const fs = require('fs');
let f = fs.readFileSync('sql/populate_vagas_semed_batch_1.sql', 'utf8');
f = f.replace(/INSERT INTO vagas_quadro \\(unidade_nome, secretaria, cargo, vagas_totais, turno, horario\\) VALUES/, 'INSERT INTO vagas_quadro (unidade_nome, secretaria, cargo, vagas_totais, turno, horario, insalubridade) VALUES');
f = f.replace(/'ASG \\(20%\\)', (\\d+), '([^']+)', '([^']+)'/g, "'ASG', $1, '', '', '20%'");
f = f.replace(/'ASG \\(40%\\)', (\\d+), '([^']+)', '([^']+)'/g, "'ASG', $1, '', '', '40%'");
f = f.replace(/'COZINHEIRA', (\\d+), '([^']+)', '([^']+)'/g, "'COZINHEIRA', $1, '', '', 'N/A'");
f = f.replace(/'PORTEIRO', (\\d+), '([^']+)', '([^']+)'/g, "'PORTEIRO', $1, '', '', 'N/A'");
fs.writeFileSync('sql/populate_vagas_semed_batch_1.sql', f);
