# Coding Conventions

**Analysis Date:** 2026-05-03

## Naming Patterns

**Files:**
- React Components: PascalCase (`AlmoxarifadoModule.tsx`)
- Server Utils: camelCase (`n8n.ts`)
- Route Handlers: `route.ts` inside feature folders

**Functions:**
- Event handlers: `handle[Action]` (e.g., `handleSalvar`)
- State setters: `set[State]`

**Variables:**
- State variables: camelCase (`colaboradores`, `stats`)
- Database records: usually snake_case or camelCase (depending on Supabase mapping)

**Types:**
- Interface/Type: PascalCase (e.g., `interface User`)

## Code Style

**Formatting:**
- Prettier (implicit)
- Tailwind CSS v4 for all styling

**Linting:**
- ESLint with Next.js core web vitals configuration

## Import Organization

**Order:**
1. React hooks (`useState`, `useEffect`)
2. Next.js components/hooks (`useRouter`, `Image`)
3. Shared icons (`lucide-react`)
4. Internal modules/libs (`@/lib/supabase`)
5. Local components/styles

**Path Aliases:**
- `@/*` - mapping to project root

## Error Handling

**Patterns:**
- Try-catch blocks for all Supabase/API calls.
- User feedback via `alert()` or conditional UI rendering.

## Logging

**Framework:** Custom Supabase-backed logs table.

**Patterns:**
- Log important actions (Create/Update/Delete) via the `GerenciaModule` logging logic.

## Comments

**When to Comment:**
- Complexity: Explain why a specific filter is used (e.g., secretariat scoping).
- TODOs: Marked for future cleanup or features.

## Function Design

**Size:** Preference for modular functions inside large components, but many modules are currently monolithic and would benefit from refactoring.

---

*Convention analysis: 2026-05-03*
