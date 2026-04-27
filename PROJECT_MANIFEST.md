# Alicerce ERP Cockpit - Project Manifest

> **Current Version:** V752.0 (Mobile Optimized Build - Hybrid Architecture)
> **Identity:** Sovereign Management System for Alicerce Serviços e Gestão.
> **Architecture:** Next.js (App Router) + Cockpit Layout Design.

---

## 🎯 Project Core & Philosophy

### Design System: The Cockpit
The interface follows a **"One Page Efficiency"** philosophy. 
- **Main View (1fr):** Operational focus (Tables, Maps, Lists).
- **Supporting Column (350px):** Dynamic intelligence, shared RH data, and active tickets.
- **QuickActions:** Global command hub for cross-departmental tasks.

### Tech Stack
- **Frontend:** Next.js 16.2.4, React 19.2.4, Tailwind CSS 4.
- **Backend:** Supabase (PostgreSQL + Auth), Hosted with n8n.
- **Workflow:** n8n-orchestrated business logic.
- **Components:** AdaptiveModal (Desktop/Mobile hybrid), Step-by-Step UX.

---

## 🧩 Module Status & Feature Catalog

### 1. Almoxarifado (Stock & Uniforms)
- **Status:** Functional.
- **Features:** 
  - Stock control with inventory alerts.
  - Digital NR-06 Receipt generation.
  - Unified EPI Delivery reports.
- **Path:** `/dashboard/almoxarifado`

### 2. Rotas & Encarregados (Field Operations)
- **Status:** Advanced (Newly Expanded).
- **Features:**
  - Route printing (Field Professional Report).
  - Personnel Request (Volante).
  - Disciplinary Action requests (Advertências).
  - Time tracking issue management (Ocorrência de Ponto).
  - Detailed fiscalization cards (Insalubridade, Horários).
- **Path:** `/dashboard/rota`

### 3. Portal do Diretor (Prefeitura/Unidades)
- **Status:** Functional.
- **Features:**
  - Presence management (Abono Coletivo/Feriados).
  - Unit-level occurrence reporting.
  - Team visibility (without EPI distribution power).
- **Path:** `/dashboard/unidade`

### 4. RH Central & Pessoal
- **Status:** Stable.
- **Features:**
  - "Admissão Master" global flow.
  - Ponto/Jornada dashboard.
  - Shared employee table used across modules.
- **Path:** `/dashboard/rh/...`

---

## 🔐 Access Control (RBAC) & Visibility

| Role | Access Scope |
| ---- | ------------ |
| **Gerência** | Full System + Relatórios & Documentos. |
| **RH** | Prefeitura, RH, Segurança do Trabalho. |
| **Encarregados** | Rota (Encarregados) + Ocorrências. |
| **Prefeitura** | Prefeitura (Portal do Diretor / RH PMG). |
| **Segurança** | Segurança do Trabalho (EPIs, CAT, Treinamentos). |

---

## ⚠️ Log of Suppressed or Deferred Features

| Feature | Status | Reason |
| ------- | ------ | ------ |
| **Offline Sync (IndexedDB)** | DEFERRED | High complexity for current phase. Relies on stable connectivity for now. |
| **Direct EPI Distribution (Prefeitura)** | REMOVED | Security/Audit policy: Only Almoxarifado/SST can distribute assets. |
| **Manual Data Overwrite** | RESTRICTED | Enforced Supabase/n8n synchronization to prevent data silos. |

---

## 🔗 Integration Map (n8n & Supabase)

- **Webhook Hub:** `lib/n8n.ts`
- **Database Client:** `lib/supabase.ts`
- **Key Triggers:**
  - `registro-abono-coletivo`: Triggers time-sheet adjustment.
  - `comunicar-ausencia`: Updates real-time presence board.
  - `abrir-ocorrencia`: Dispatches incident tickets to relevant sectors.

---

## 📈 Next Steps (Roadmap)
1. [DONE] Full synchronization of Supabase local containers (Integrated with Cloud).
2. [DONE] Implementation of automatic PDF generation for NR-06 (Step-by-Step UX).
3. Automated KPI aggregation for Intel BI module.
4. Security hardening for WhatsApp notifications via n8n.
