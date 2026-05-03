<!-- refreshed: 2026-05-03 -->
# Architecture

**Analysis Date:** 2026-05-03

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Router                      │
├──────────────────┬──────────────────┬───────────────────────┤
│   Public Pages   │  Dashboard Auth  │    API Routes         │
│  `app/page.tsx`  │ `app/dashboard/` │     `app/api/`        │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Modules                         │
│         `app/dashboard/components/modules/`                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                Supabase (Database/Auth)                     │
│                `lib/supabase.ts`                            │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `DashboardPage` | Main entry point for logged-in users | `app/dashboard/page.tsx` |
| `RHModule` | Human Resources and Recruitment management | `.../modules/RHModule.tsx` |
| `ComprasModule` | Procurement and Purchase Requests | `.../modules/ComprasModule.tsx` |
| `AlmoxarifadoModule` | Inventory and Warehouse management | `.../modules/AlmoxarifadoModule.tsx` |
| `GerenciaModule` | Dashboard overview and system logs | `.../modules/GerenciaModule.tsx` |

## Pattern Overview

**Overall:** Modular Component-Based Architecture within Next.js App Router.

**Key Characteristics:**
- **State-Driven Tabs:** Modules are loaded dynamically based on user selection in the sidebar.
- **Hierarchical Access:** Data filtering based on user's `secretaria` and `unidade`.
- **Client-Side Persistence:** Use of `localStorage` for session awareness (Department/Secretariat).

## Layers

**UI Layer:**
- Purpose: Render modular dashboards and forms.
- Location: `app/dashboard/components/`
- Contains: React components, hooks, and Lucide icons.
- Depends on: `lib/supabase.ts`, `lucide-react`
- Used by: `app/dashboard/page.tsx`

**API Layer:**
- Purpose: Handle external submissions and server-side logic.
- Location: `app/api/`
- Contains: Next.js Route Handlers.

**Data Layer:**
- Purpose: Direct Supabase integration for CRUD operations.
- Location: `lib/supabase.ts`, `utils/supabase/`

## Data Flow

### Primary Request Path (Dashboard)

1. User logs in at `app/page.tsx`.
2. Session and `secretaria` stored in `localStorage`.
3. `app/dashboard/page.tsx` loads and identifies user role.
4. Active module (e.g., `ComprasModule.tsx`) fetches scoped data from Supabase.

## Key Abstractions

**Modular Tabs:**
- Purpose: Allow single-page application feel within the dashboard.
- Examples: `app/dashboard/page.tsx` tab switcher.

## Entry Points

**Main Portal:**
- Location: `app/page.tsx`
- Triggers: User visits root URL.
- Responsibilities: Authentication and initial routing.

## Architectural Constraints

- **Single-Threaded Context:** Extensive use of Client Components (`"use client"`) for interactivity.
- **Auth Guard:** Middleware protects `/dashboard` routes.

## Error Handling

**Strategy:** Inline validation and Toast/Alert notifications.

## Cross-Cutting Concerns

**Logging:** Centralized logs table in Supabase.
**Validation:** Zod-like patterns (though mostly manual currently).
**Authentication:** Managed via Supabase Auth + Middleware.

---

*Architecture analysis: 2026-05-03*
