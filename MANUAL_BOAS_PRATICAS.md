# 📜 Manual de Boas Práticas — Alicerce ERP v753.8.56

Este documento estabelece os padrões de desenvolvimento, design e operação para garantir a longevidade, segurança e soberania do sistema.

---

## 1. Princípios de Desenvolvimento

### Clean Code
- Funções pequenas e de responsabilidade única (SRP)
- Nomes descritivos — sem abreviações obscuras
- Sem lógica duplicada — crie hooks (`use*`) para lógica compartilhada
- Sem `any` TypeScript desnecessário — tipar interfaces críticas

### Commits Atômicos
- Cada commit = uma única alteração funcional
- Prefixos obrigatórios: `feat`, `fix`, `security`, `perf`, `docs`, `refactor`
- Versão no sufixo: `[v753.8.56]`
- ❌ Proibido: commits como `"fix"`, `"wip"`, `"ajustes"`

### Segurança em Primeiro Lugar
- **Nunca** hardcode credenciais no código — usar `process.env.*`
- **Nunca** commitar `.env.local` (está no `.gitignore`)
- Toda ação administrativa gera registro em `historico_gestao` ou `atividades`
- Rate limiting em endpoints de autenticação

---

## 2. Design e UI (High-End UX)

### Paleta de Cores
- Usar variáveis CSS do Design System: `var(--brand)`, `var(--bg-card)`, `var(--text-primary)`
- `--brand` = `#ff6a00` (laranja Alicerce)
- Evitar cores Tailwind genéricas (`bg-red-500`) diretamente — usar as variáveis

### Feedback Visual (Regra Absoluta)
- ❌ **Proibido:** `alert()`, `confirm()` nativos do browser
- ✅ **Obrigatório:** `toast.success()`, `toast.error()`, `toast.loading()` do **Sonner**
- Ações críticas (salvar, excluir) sempre geram log de auditoria

### Mobile-First
- Validar toda interface em 390px (iPhone) antes de cada deploy
- Usar `AdaptiveModal` para modais — ajusta automaticamente entre drawer (mobile) e modal (desktop)
- Tabelas densas: `overflow-x-auto` com `sticky` para colunas críticas

### Performance Visual
- `animate-fade-in` para transições de entrada
- `useMemo` para listas filtradas (evitar recalcular a cada render)
- Imports pesados (jsPDF, xlsx): sempre `await import()` — nunca no topo do arquivo

---

## 3. Fluxo de Trabalho (Workflow)

```
1. PLANEJAMENTO
   └── Entender regra de negócio antes de codar
   └── Identificar impacto no banco de dados

2. BANCO DE DADOS
   └── Criar script SQL versionado em /sql/
   └── Testar no Supabase antes de usar no código

3. IMPLEMENTAÇÃO
   └── Desenvolver componente/hook
   └── Testar localmente com `npm run dev`

4. AUDITORIA
   └── Garantir que ações admin geram logs
   └── Verificar que não há console.log, alert() ou credenciais

5. BUILD + DEPLOY
   └── `npm run build` — deve passar sem erros
   └── `git commit` + `git push` → Easypanel faz deploy automático
   └── Verificar portal.alicerce.cloud após 2-3 minutos
```

---

## 4. Gestão de Dados e Interface Dinâmica

### Motores Dinâmicos
- Preferir campos `JSONB` gerenciáveis (ex: `checklist_extra`) + tabelas de configuração (`config_checklist_rh`)
- Isso permite ao usuário final gerenciar colunas sem intervenção técnica

### Tabelas de Alta Densidade
- `overflow-x-auto` no container pai
- Colunas críticas (Nome, Ações) com `sticky left-0` e `z-10`
- Cabeçalho com `text-[10px] font-black uppercase tracking-widest`

### Integridade de Dados
- Nunca apague dados sem confirmação + `justificativa` obrigatória
- Exclusões geram registro em `logs_auditoria` antes de executar o DELETE
- Implementar atualizações otimistas (Optimistic Updates) para UX fluida

### Lazy Loading de Módulos Pesados
```typescript
// ❌ Errado — carrega 800KB mesmo para quem não imprime
import jsPDF from 'jspdf';

// ✅ Correto — carregado apenas quando necessário
const handlePrint = async () => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  // ...
};
```

---

## 5. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sim | Chave pública anônima do Supabase |

> **No Easypanel:** Configure as env vars no painel do serviço, não no arquivo `.env.production`.

---

## 6. Histórico de Governança e Atualizações

### • 16/05/2026 — Security + Performance Hardening (v753.8.56)
- **🔐 CRÍTICO:** Chave JWT Supabase movida de hardcode para `process.env`
- **🔐 CRÍTICO:** Rate limiting no login (5 tentativas → bloqueio 10 min)
- **⚡ PERF:** Lazy load do jsPDF/autoTable — redução de **~800KB** no bundle inicial
- **⚡ PERF:** `useMemo` nos filtros de colaboradores do EncarregadoModule
- **🎨 UX:** Todos os `alert()` nativos substituídos por `toast()` do Sonner em **6 módulos**
- **🔇 LIMPO:** Removidos `console.log` de produção em 5 arquivos (roles, sync info, checklist data)

### • 15/05/2026 — Módulo Encarregado: Impressão e Edição (v753.8.55)
- **📄 Impressão de Equipe:** Botão de PDF na aba Equipe com detecção de filtro ativo
- **📱 Campo Telefone:** Adicionado campo "Telefone / WhatsApp" na `FichaColaborador360`
- **🗺️ Impressão de Rota:** PDF personalizado com seleção de colunas, agrupamento sem quebra de página

### • 09/05/2026 — Painel de Gerência e Correções (v753.8.51)
- **🐛 FIX:** `ReferenceError: Sparkles is not defined` no Painel de Fiscalização
- **🐛 FIX:** `ReferenceError: maxASG is not defined` no Painel de RH
- **📊 Métricas em Tempo Real:** Painel de Gerência com dados reais da tabela `atividades`

### • 09/05/2026 — SLA em Horário Comercial (v753.5)
- **Implementação Global de Horas Úteis:** `getBusinessHoursElapsed()` em `utils/dateUtils.ts`
- **Janela:** Segunda a Sexta, 07:00 às 17:00
- **Congelamento automático** em fins de semana e feriados

### • 09/05/2026 — Motor de Checklist RH v2.1
- Cockpit de configuração via ícone de engrenagem no cabeçalho da tabela
- Criação, renomeação, coloração e reordenação de colunas sem deploy
- Atualizações otimistas (Optimistic Updates) com rollback automático em erro

---

*Atualizado em: 16/05/2026 — Versão v753.8.56*
*Assinado: Equipe Antigravity & A3DS Ecommerce*
