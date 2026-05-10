# 🏛️ Dossiê Técnico: Alicerce ERP v753.8
**Data do Relatório:** 10/05/2026
**Status:** Produção Estabilizada (v753.8.0)

---

## 1. Visão Geral do Sistema
O **Alicerce ERP** é uma plataforma de Governança Soberana (Sovereign Governance) projetada para orquestrar operações complexas em larga escala. O sistema integra inteligência de dados, automação de campo e rigoroso controle de RH em uma interface high-end responsiva.

### 🛡️ Pilares Estratégicos:
- **Soberania de Dados**: Controle total sobre a infraestrutura via Supabase e Docker.
- **Eficiência de Campo**: Módulos otimizados para smartphones (Encarregados).
- **Auditabilidade Total**: Log de atividades granulado para cada ação administrativa.
- **UX Zero-Blink**: Atualizações otimistas e transições fluidas para eliminar a percepção de latência.

---

## 2. Arquitetura Tecnológica (Stack 2026)
O sistema utiliza as tecnologias mais modernas do ecossistema Web para garantir performance e escalabilidade.

- **Frontend**: `Next.js 15` (App Router) + `React 19`.
- **Estilização**: `Tailwind CSS 4.0` (Design System Premium).
- **Persistência**: `Supabase` (PostgreSQL) com RLS (Row Level Security).
- **Automação**: `n8n` (Orquestração de Bots e Webhooks).
- **Infraestrutura**: `Docker` + `Easypanel` (VPS Dedicada).

---

## 3. Estrutura de Dados (Database Schema)
O coração do Alicerce Ops reside em seu esquema PostgreSQL altamente relacionado.

| Tabela | Função Principal | Chaves Críticas |
| :--- | :--- | :--- |
| `usuarios` | Cadastro mestre de colaboradores e acessos | `id`, `nivel_acesso`, `secretaria` |
| `usuarios_docs` | Repositório de verificação de documentos | `usuario_id`, `status_verificacao` |
| `config_checklist_rh` | Motor dinâmico de colunas do RH | `label`, `color`, `ordem` |
| `feedback_diretor` | Registro de faltas e ocorrências pelo cliente | `diretor_id`, `colaborador_id`, `status` |
| `unidades` | Postos de trabalho (Escolas/Hospitais) | `nome`, `rota`, `diretor_id` |
| `atividades` | Log de auditoria global | `usuario_id`, `mensagem`, `tipo` |
| `transferencias` | Fluxo de movimentação de pessoal | `origem`, `destino`, `status_gerencia` |
| `missões` | Sistema de tarefas para o campo | `titulo`, `checklist_json` |

---

## 4. Lógicas de Negócio e Governança

### ⏱️ SLA em Horário Comercial
- **Regra**: O tempo de resposta é calculado apenas em **Horas Úteis**.
- **Janela**: Segunda a Sexta, das **07:00 às 17:00**.
- **Comportamento**: O relógio "congela" automaticamente em fins de semana e feriados para garantir métricas de desempenho justas.

### 📋 Motor de Checklist RH v2.1 (Cockpit)
- **Flexibilidade**: Permite ao gestor criar, renomear, colorir e reordenar colunas de verificação sem tocar no código.
- **JSONB Implementation**: Dados extras são armazenados em campos JSONB para flexibilidade infinita de novos documentos.

### 👮 Controle de Acesso (RBAC)
1. **Nível 1 (Operacional)**: Acesso via Celular (Missões, Admissão Rápida).
2. **Nível 2 (Encarregado)**: Gestão de Rota e Equipe Local.
3. **Nível 3 (Gerente)**: Painel de Controle Central, Auditoria e Aprovações.
4. **Nível 2 (Diretor de Unidade / Supervisor)**: Portal de Fiscalização do Cliente ou Gestão de Campo.
5. **Nível 10 (Admin)**: Acesso total e configurações de sistema.

---

## 5. Infraestrutura e Ciclo de Deploy

### 🏗️ Fluxo de CI/CD:
1. **Desenvolvimento**: Alterações feitas via Antigravity AI.
2. **Push**: Commit atômico para o repositório GitHub.
3. **Build**: Easypanel detecta o push e inicia o `docker build` (Next.js Standalone).
4. **Invalidation**: O `generateBuildId` único força a quebra de cache nos navegadores.

### 🚀 Configuração do Servidor:
- **Build Strategy**: `npm run build` gerando output `standalone`.
- **Porta**: 3000 (Exposta via Proxy Nginx do Easypanel).
- **Sincronia**: Banco de Dados Supabase conectado via `NEXT_PUBLIC_SUPABASE_URL`.

---

## 6. Manutenção e Boas Práticas
- **Atualização Obrigatória**: A cada novo deploy, o `ManualModule.tsx` e o `MANUAL_BOAS_PRATICAS.md` devem ser atualizados.
- **Zero Placeholder**: Nunca use dados falsos; toda implementação deve ser testada com a lógica de produção.
- **Mobile-First**: Toda interface deve ser validada em viewport de 390px (iPhone 12 Pro).

---
*Relatório assinado eletronicamente por: **Antigravity AI Engineering**.*
