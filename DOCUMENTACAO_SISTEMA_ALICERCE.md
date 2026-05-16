# 🛡️ Alicerce Ops: Ecossistema de Gestão Operacional (v753.8.56)

## 📑 Visão Geral Executiva
O **Alicerce Ops** é um sistema ERP desenvolvido sob medida para governança soberana de operações de campo. Combinando Next.js, Supabase e automação via n8n, o sistema transforma o caos operacional em dados estratégicos, permitindo decisões baseadas em evidências em tempo real.

**Ambiente de produção:** https://portal.alicerce.cloud
**Versão atual:** v753.8.56 (Security + Performance Hardening)

---

## 🏢 1. Módulo Gerência (Cockpit Executivo)
Projetado para supervisão macro, auditoria de alta precisão e tomada de decisão estratégica.

### 📊 Painel de Controle
- **KPIs em tempo real:** Colaboradores ativos, requisições de volante, vagas abertas, tickets pendentes
- **Feed de atividades:** Registro cronológico de todas as ações do sistema (tabela `atividades`)
- **Acesso via abas:** Visão Geral · Fiscalização · RH · Unidades · Missões

### 🗺️ Fiscalização de Campo
- Mapeamento de todas as unidades ativas com encarregado responsável
- Controle de rotas e reorganização de supervisão por zona geográfica
- Monitoramento de volantes: requisições, aprovações e histórico

### 👥 Aba RH (Gerência)
- Visão agregada de colaboradores por secretaria
- Aprovações de transferências e movimentações
- Acesso à `FichaColaborador360` para edição com auditoria obrigatória

### 🎯 Sistema de Missões
- Criação de desafios semanais/mensais com checklists customizados
- Feedback em tempo real dos encarregados
- Histórico de conclusão por unidade

---

## 👷 2. Módulo Encarregado (Gestão de Campo)
Interface Mobile-First focada em produtividade de campo.

### 🏫 Aba: Minhas Unidades
- Cards com escolas/postos sob responsabilidade do encarregado
- Status de colaboradores, alertas de vaga e botão de edição de unidade

### 👥 Aba: Equipe (Minha Equipe)
- Tabela de colaboradores com busca e filtros (por unidade e cargo)
- Filtros memoizados — sem lentidão em equipes grandes
- **Edição via Ficha 360°:** Clique no colaborador → editar Telefone, Insalubridade, Horário, etc.
- **Impressão de Equipe:** Botão PDF que detecta filtro ativo
  - Com filtro de unidade → "Imprimir Unidade [Nome]"
  - Sem filtro → "Imprimir Equipe Completa"
  - jsPDF carregado sob demanda (lazy-load)

### 🗺️ Impressão de Rota (Modal)
Disponível na aba Unidades:
- Seleção de campos: Unidade · Colaboradores · Telefone · Insalubridade · Função · Horário
- Agrupamento por unidade sem quebra de página
- PDF em landscape A4 com logo e data de geração

### ⚡ Admissão Rápida
- Formulário simplificado para cadastrar colaborador diretamente do celular
- Campos: Nome, Telefone, Unidade, Função, Horário, Insalubridade, Carga Horária
- Gravação direta em `usuarios` com `status: 'EM_ADMISSAO'`

### 📋 CAT Digital (Acidente de Trabalho)
- Busca de colaborador em tempo real (autocomplete)
- Campos: Data, Hora, Tipo, Descrição, Testemunhas
- Notificação automática ao Técnico de Segurança via n8n
- Toast de confirmação (substituiu alert() nativo)

### 🛡️ EPI (Equipamentos de Proteção)
- Seleção de colaborador e itens de EPI
- Registro de entrega com data e responsável
- Histórico consultável por unidade

### ⚡ Disciplina e Transferências
- Abertura de advertências com categoria e justificativa
- Solicitação de transferência com destino e motivo
- Acompanhamento do status pela gerência

### 🎯 Minhas Missões (Radar)
- Cards gamificados com desafios da diretoria
- Checklist interativo com submit por missão
- Feedback registrado em tempo real

---

## 👥 3. Módulo RH e DP

### Admissão Master (Onboarding 360°)
- Fluxo de 32 etapas com verificação documental completa
- Integração com `candidatos` → promoção para `usuarios`
- Controle de ASO, contrato, VT/VA, CTPS e sistemas externos (Strato)

### Checklist Dinâmico (v2.1)
- Colunas gerenciadas sem deploy via `config_checklist_rh`
- Criação, renomeação, coloração, reordenação — tudo em tempo real
- Atualizações otimistas com rollback automático em erro
- Dados extras em JSONB (`checklist_extra`) na tabela `usuarios`

### Offboarding Estruturado
- Fluxo de 16 etapas: devolução de ativos, exame demissional, TRCT
- Cada etapa gera log de auditoria em `historico_gestao`

### Controle de Ponto
- Conferência de batidas por colaborador e unidade
- Integração com Bot WhatsApp para notificação de irregularidades
- Fila de cobrança automática

---

## 📦 4. Compras e Almoxarifado

### Compras
- Catálogo de insumos padronizados
- Fluxo: Requisição → Aprovação → Compra → Entrega
- Prazo mínimo de 30 dias documentado no termo de aceite

### Almoxarifado
- Inventário central com controle de saídas por unidade
- Auditoria de discrepâncias (físico vs. sistema)

---

## 🔐 5. Segurança e SST

### Central de Ocorrências
- Tickets setoriais com prioridade (BAIXA → CRÍTICA)
- SLA em horário comercial (seg-sex 07h-17h)
- Resolução exige justificativa — gera log em `historico_gestao`
- Auto-refresh a cada 60 segundos

### CAT Digital (Rota SST dedicada)
- Investigação imediata de acidentes de trabalho
- Histórico de CATs com filtro por colaborador e tipo
- Notificação automática para técnico de segurança

---

## 🔐 6. Segurança do Sistema (v753.8.56)

### Autenticação
- Login por telefone + senha (padrão: 4 últimos dígitos)
- Suporte a senha customizada via campo `senha` em `usuarios`
- Sessão via cookie `auth_token` + `crm_user` em localStorage

### Rate Limiting
- **5 tentativas** erradas → bloqueio de **10 minutos**
- Controle via `sessionStorage` (client-side)
- Contador limpo automaticamente após login bem-sucedido

### Credenciais
- Chaves Supabase 100% via `process.env` — nunca no bundle JS
- Configuradas no Easypanel (não no repositório)
- Validação de startup: erro fatal se variáveis não encontradas

---

## 🏗️ 7. Arquitetura e Escalabilidade

### RBAC (Role-Based Access Control)
O filtro de módulos usa `nivel_acesso` + `role` para determinar o que cada usuário vê:
```
Nível 1 → Colaborador (acesso futuro via app)
Nível 2 → Encarregado / Diretor de Unidade
Nível 3 → Gerente / Supervisor
Nível 4+ → Admin / Dev (acesso total)
```

### Escalabilidade
- Preparado para 100 a 10.000 colaboradores sem refatoração
- Queries com `.select()` específico — sem `SELECT *` em tabelas grandes
- Cache local com otimistic updates para UX zero-latência

### Design System
- Variáveis CSS centralizadas em `globals.css`
- Dark mode OLED (`#000000`) + Light mode
- `border-radius` com variáveis semânticas (`--radius-sm`, `--radius-md`)
- Animações: `animate-fade-in`, `glow-pulse`, `cubic-bezier` em transições

---

*Documentação atualizada em: 16/05/2026*
*Sistema de Inteligência Alicerce v753.8.56*
