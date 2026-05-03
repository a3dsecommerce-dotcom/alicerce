# Codebase Structure

**Analysis Date:** 2026-05-03

## Directory Layout

```
alicerce-crm/
├── app/                # Next.js App Router (Pages and API)
│   ├── api/            # Server-side route handlers
│   ├── dashboard/      # Protected dashboard routes
│   │   └── components/ # Dashboard-specific UI components
│   │       └── modules/# Business logic modules (RH, Compras, etc.)
│   └── (public)/       # Login and external recruitment pages
├── components/         # Shared UI components
├── lib/                # Shared libraries and utilities (Supabase, n8n)
├── public/             # Static assets
├── scripts/            # Utility scripts (deployment, DB sync)
├── sql/                # Database schema and migrations
├── utils/              # Helper functions
└── __tests__/          # Test suites
```

## Directory Purposes

**app/dashboard/components/modules/:**
- Purpose: Core business functionality of the ERP.
- Contains: Large React components representing independent modules.
- Key files: `RHModule.tsx`, `ComprasModule.tsx`, `AlmoxarifadoModule.tsx`.

**lib/:**
- Purpose: External service initializers.
- Contains: Supabase client setup, n8n integration logic.
- Key files: `supabase.ts`, `n8n.ts`.

**sql/:**
- Purpose: Database source of truth.
- Contains: SQL scripts for table creation and updates.

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Login screen.
- `app/dashboard/page.tsx`: Dashboard root.

**Configuration:**
- `next.config.ts`: Next.js config.
- `tailwind.config.ts`: Styling configuration.

**Testing:**
- `__tests__/SidebarLink.test.tsx`: Sample UI test.

## Naming Conventions

**Files:**
- Components: PascalCase (`RHModule.tsx`).
- Utilities: camelCase (`supabase.ts`).

**Directories:**
- Feature folders: lowercase-kebab-case (`dashboard`, `api`).

## Where to Add New Code

**New Business Module:**
- Implementation: `app/dashboard/components/modules/`
- Add to tab switcher: `app/dashboard/page.tsx`

**New API Endpoint:**
- Primary code: `app/api/[module]/route.ts`

**Shared Utility:**
- Implementation: `utils/` or `lib/`

---

*Structure analysis: 2026-05-03*
