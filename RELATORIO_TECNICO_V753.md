# 🏗️ Dossiê Técnico: Alicerce ERP v753.8.56
**Última Atualização:** 16/05/2026
**Status:** ✅ Produção Estável — Security + Performance Hardening

---

## 1. Visão Geral do Sistema

O **Alicerce ERP** é uma plataforma de Governança Soberana (Sovereign Governance) projetada para orquestrar operações complexas em larga escala. O sistema integra inteligência de dados, automação de campo e rigoroso controle de RH em uma interface high-end responsiva.

### 🛡️ Pilares Estratégicos
| Pilar | Descrição |
|---|---|
| **Soberania de Dados** | Controle total via Supabase self-hosted + Docker |
| **Eficiência de Campo** | Módulos otimizados para smartphones (Mobile-First) |
| **Auditabilidade Total** | Log granulado de cada ação administrativa |
| **Segurança Ativa** | Rate limiting, env vars, sem credenciais expostas |
| **Performance Progressiva** | Lazy-loading de módulos pesados (PDF, ~800KB) |

---

## 2. Arquitetura Tecnológica (Stack 2026)

```
┌─────────────────────────────────────────────┐
│              FRONTEND (Next.js 16.2)         │
│  React 19 · App Router · Turbopack          │
│  CSS Custom Properties · Sonner · jsPDF     │
├─────────────────────────────────────────────┤
│           BACKEND / BaaS (Supabase)          │
│  PostgreSQL · RLS · Real-time · Storage     │
├─────────────────────────────────────────────┤
│           AUTOMAÇÃO (n8n self-hosted)        │
│  Webhooks · WhatsApp Bot · E-mail Triggers  │
├─────────────────────────────────────────────┤
│         INFRAESTRUTURA (VPS + Easypanel)     │
│  Docker Standalone · Nginx · CI/CD GitHub   │
└─────────────────────────────────────────────┘
```

| Dependência | Versão | Propósito |
|---|---|---|
| next | 16.2.4 | Framework Frontend |
| react | 19 | UI Library |
| @supabase/supabase-js | latest | Database Client |
| jspdf + jspdf-autotable | latest | PDF Generation (lazy-loaded) |
| sonner | latest | Toast Notifications |
| lucide-react | latest | Icon Library |

---

## 3. Estrutura de Dados (Database Schema)

| Tabela | Função Principal | Chaves Críticas |
|:---|:---|:---|
| `usuarios` | Cadastro mestre de colaboradores e acessos | `id`, `nivel_acesso`, `secretaria`, `telefone` |
| `unidades` | Postos de trabalho (Escolas/Hospitais) | `nome`, `rota`, `responsavel_telefone` |
| `config_checklist_rh` | Motor dinâmico de colunas do RH | `label`, `color`, `ordem` |
| `tickets_sla` | Central de ocorrências e SLA | `assunto`, `setor_destino`, `status`, `sequencial` |
| `informativos_operacionais` | Faltas, extras e substituições | `tipo`, `colaborador_id`, `unidade` |
| `escala_volantes` | Escala de pessoal volante | `data`, `unidade`, `colaborador_id` |
| `requisicoes_volantes` | Solicitações de volante pelos Diretores | `solicitante_id`, `unidade`, `status` |
| `atividades` | Log de auditoria global | `usuario_id`, `mensagem`, `tipo` |
| `historico_gestao` | Auditoria de edições sensíveis | `executor_tel`, `tipo_acao`, `motivo` |
| `investigacao_cat` | CATs de acidentes | `colaborador_id`, `tipo_acidente`, `status` |
| `transferencias` | Fluxo de movimentação de pessoal | `origem`, `destino`, `status_gerencia` |
| `missoes` | Tarefas para o campo | `titulo`, `checklist_json` |
| `candidatos` | Banco de candidatos | `nome`, `cpf`, `status_candidato` |

---

## 4. Lógicas de Negócio e Governança

### ⏱️ SLA em Horário Comercial
- **Janela:** Segunda a Sexta, das **07:00 às 17:00**
- **Congelamento:** O relógio "pausa" em fins de semana e feriados
- **Centralização:** Lógica unificada em `/utils/dateUtils.ts → getBusinessHoursElapsed()`

### 🔐 Controle de Acesso (RBAC)
| Nível | Perfil | Acesso |
|---|---|---|
| 1 | Colaborador | Apenas app mobile (futuro) |
| 2 | Encarregado / Diretor de Unidade | Módulo Encarregado ou Portal Diretor |
| 3 | Gerente / Supervisor | Módulo Gerência completo |
| 4+ | Admin / Dev | Acesso total + configurações |

### 🔒 Segurança de Autenticação (v753.8.56)
- **Credenciais:** 100% via `process.env` — nunca hardcoded no bundle
- **Rate Limiting:** 5 tentativas → bloqueio de 10 minutos (client-side via `sessionStorage`)
- **Sessão:** `auth_token` em cookie httpOnly + `crm_user` em localStorage
- **Fallback de Diretor:** Login por telefone da unidade cria sessão virtual `is_virtual: true`

### 📋 Motor de Checklist RH (v2.1)
- Colunas gerenciadas via tabela `config_checklist_rh` (sem deploy necessário)
- Dados extras em `checklist_extra` (JSONB) na tabela `usuarios`
- Suporte a criação, renomeação, coloração, reordenação e exclusão otimistas

---

## 5. Performance (Melhorias v753.8.56)

| Otimização | Técnica | Impacto |
|---|---|---|
| jsPDF lazy-load | `await import('jspdf')` | **-800KB** no bundle inicial |
| Filtros de colaboradores | `useMemo` + deps array | Elimina recalcular a cada render |
| Console.logs removidos | Limpeza global | Bundle menor + segurança |
| Sem re-fetch desnecessário | `useEffect` com deps mínimas | Menos chamadas ao banco |

---

## 6. Infraestrutura e Ciclo de Deploy

### 🏗️ Fluxo CI/CD
```
Desenvolvimento (Antigravity AI)
  ↓
git commit + git push → GitHub (main)
  ↓
Easypanel detecta push
  ↓
docker build (Next.js Standalone)
  ↓
Container restart automático
  ↓
portal.alicerce.cloud atualizado ✅
```

### ⚙️ Configuração do Servidor
- **Build:** `npm run build` → output `standalone`
- **Porta:** 3000 (proxy via Nginx Easypanel)
- **Env Vars:** Configuradas no painel do Easypanel (não no `.env.production` do repositório)
- **Banco:** Supabase self-hosted via `NEXT_PUBLIC_SUPABASE_URL`

---

## 7. Convenções de Código

### Commits Atômicos
```
tipo(escopo): descrição curta [vX.Y.Z]

Exemplos:
feat(encarregado): adiciona impressão de rota com filtros [v753.8.50]
fix(gerencia): corrige ReferenceError Sparkles [v753.8.51]
security: move supabase keys to env, rate-limit login [v753.8.56]
perf: lazy-load jsPDF (-800KB bundle) [v753.8.56]
```

### Nomenclatura de Arquivos
| Tipo | Padrão | Exemplo |
|---|---|---|
| Módulos principais | `PascalCase + Module` | `EncarregadoModule.tsx` |
| Hooks | `camelCase + use` | `useTransferencias.ts` |
| Utils | `camelCase` | `dateUtils.ts` |
| SQL migrations | `snake_case` | `add_telefone_usuarios.sql` |

---

## 8. Boas Práticas (Regras Absolutas)

1. **Nunca use `alert()`** — use `toast.success()` / `toast.error()` do Sonner
2. **Nunca commite credenciais** — use `process.env.*` para tudo que é sensível
3. **Nunca adicione `console.log` em produção** — use apenas em desenvolvimento
4. **Sempre registre auditoria** — ações críticas vão para `historico_gestao` e `atividades`
5. **Imports pesados são lazy** — jsPDF, xlsx e similares só com `await import()`
6. **Toda ação destrutiva tem confirmação** — modal de confirmação + `justificativa`
7. **Mobile-first obrigatório** — validar em 390px antes de cada deploy

---

*Relatório assinado eletronicamente por: **Antigravity AI Engineering**.*
*Versão: v753.8.56 — Maio/2026*
