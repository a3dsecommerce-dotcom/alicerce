# 🏛️ Alicerce ERP — Gestão Cognitiva e Soberana

![Alicerce Banner](https://img.shields.io/badge/Versão-753.8.56-orange?style=for-the-badge&logo=rocket)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)
![n8n](https://img.shields.io/badge/n8n-Automação-red?style=for-the-badge&logo=n8n)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Deploy](https://img.shields.io/badge/Produção-portal.alicerce.cloud-brightgreen?style=for-the-badge)

O **Alicerce ERP** é uma plataforma de gestão operacional desenvolvida para ambientes B2G de alta demanda. Centraliza Recursos Humanos, Suprimentos, Segurança do Trabalho e Gestão de Campo em uma interface responsiva, auditável e segura.

---

## 🚀 Módulos Principais

### 🏢 Gerência (Cockpit Executivo)
- **Painel de Controle:** KPIs em tempo real (colaboradores, volantes, tickets, vagas abertas)
- **Fiscalização de Campo:** Monitoramento de rotas, encarregados e unidades
- **Central de RH:** Controle de admissão, offboarding e ciclo de vida do colaborador
- **Sistema de Missões:** Lançamento de desafios e auditorias para o campo
- **Requisições de Volante:** Gestão de pessoal reserva com notificação integrada

### 👷 Encarregado (Gestão de Campo)
- **Minhas Unidades:** Visão de todas as escolas/postos sob responsabilidade
- **Gestão de Equipe:** Tabela de colaboradores com busca, filtros e edição (incl. telefone/WhatsApp)
- **Impressão de Rota:** PDF personalizado com seleção de colunas (Telefone, Insalubridade, Função, Horário)
- **Impressão de Equipe:** Geração de PDF com filtro por unidade ou equipe completa — lazy-loaded
- **Admissão Rápida:** Cadastro de novo colaborador diretamente do celular
- **CAT Digital:** Registro de acidente de trabalho com busca de colaborador em tempo real
- **Gestão de EPI:** Controle de entrega de equipamentos por unidade
- **Disciplina e Transferências:** Fluxos de advertência e movimentação de pessoal
- **Minhas Missões:** Aceite e preenchimento de checklists operacionais em campo

### 👥 Recursos Humanos
- **Admissão Master (32 etapas):** Onboarding completo com conformidade documental
- **Checklist Dinâmico:** Colunas customizáveis via `config_checklist_rh` (criar, renomear, colorir, reordenar)
- **Offboarding Estruturado:** Desligamento em 16 etapas com auditoria de ativos
- **Controle de Ponto:** Conferência e ajuste com integração via Bot WhatsApp
- **Benefícios:** Gestão de VT, VA e convênios

### 🛒 Compras e Almoxarifado
- **Requisições de Compra:** Fluxo digital de solicitação de materiais
- **Tracking de Pedidos:** Rastreio em tempo real (Aprovado → Comprado → Em Trânsito → Entregue)
- **Controle de Estoque:** Inventário central com auditoria de saídas

### 🔐 Segurança e Ocorrências
- **Central de Ocorrências:** Tickets setoriais com SLA em horário comercial
- **CAT Digital:** Registro imediato de acidentes com notificação do técnico de segurança
- **Análise de Risco:** Mapeamento por unidade

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16.2 (App Router) + React 19 |
| Estilização | Vanilla CSS + Design System proprietário |
| Persistência | Supabase (PostgreSQL) + RLS |
| Automação | n8n (webhooks e bots) |
| PDF | jsPDF + autoTable (lazy-loaded) |
| Notificações | Sonner (toasts) |
| Infraestrutura | Docker + Easypanel + VPS |

---

## 📦 Instalação e Execução

```bash
# 1. Clonar
git clone https://github.com/a3dsecommerce-dotcom/alicerce.git && cd alicerce-crm

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais

# 4. Desenvolvimento
npm run dev

# 5. Build de produção
npm run build
```

### Variáveis de Ambiente Obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ **Nunca commite credenciais no código.** Use sempre `.env.local` (ignorado pelo Git).

---

## 🔒 Segurança

- **Credenciais via Env:** Chaves Supabase em variáveis de ambiente — nunca no bundle
- **Rate Limiting:** Login bloqueado por 10 min após 5 tentativas erradas
- **RBAC:** Controle de acesso hierárquico (Nível 1→10)
- **Auditoria:** Toda ação crítica registrada em `historico_gestao` e `atividades`
- **Zero console.log em produção:** Logs internos removidos do bundle final

---

## 🌐 Produção

| Recurso | URL |
|---|---|
| Portal | https://portal.alicerce.cloud |
| Banco de Dados | Supabase (self-hosted via Easypanel) |
| Automações | n8n (self-hosted) |
| CI/CD | GitHub → Easypanel (auto-deploy on push) |

---

Desenvolvido por **A3DS Ecommerce** & **Antigravity AI**
Versão Atual: **v753.8.56** — *Security + Performance Hardening*
