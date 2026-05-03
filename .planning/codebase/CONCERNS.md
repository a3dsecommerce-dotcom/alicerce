# Codebase Concerns

**Analysis Date:** 2026-05-03

## Tech Debt

**Monolithic Modules:**
- Issue: `RHModule.tsx`, `AlmoxarifadoModule.tsx`, and `ComprasModule.tsx` are large components (~1000 lines) containing UI, state management, and API calls.
- Impact: Harder to maintain, test, and refactor.
- Fix approach: Extract logic into custom hooks (e.g., `useColaboradores`, `useRequisicoes`) and split UI into smaller atoms.

**Data Scoping Consistency:**
- Issue: Legacy records in Supabase may lack the `secretaria_destino` field.
- Impact: Incomplete reports and "S/ SEC" indicators in UI.
- Fix approach: Backend migration script to back-populate fields based on user-unit mapping.

## Known Bugs

**Login Synchronization:**
- Symptoms: Occasional delay in dashboard loading if `localStorage` isn't updated instantly.
- Trigger: Slow network or race condition during `createClient` on the server vs client.
- Current mitigation: Forced reload/sync logic added to `app/page.tsx` and `app/dashboard/page.tsx`.

## Security Considerations

**Client-Side Scoping:**
- Risk: Filtering by `secretaria` happens primarily on the client based on `localStorage`.
- Impact: Malicious user could potentially change `localStorage` to view other department data.
- Recommendations: Implement Row Level Security (RLS) in Supabase tied to user's `secretaria` metadata.

## Performance Bottlenecks

**Large List Rendering:**
- Problem: `RHModule` can become sluggish with 1000+ collaborators.
- Cause: Rendering all rows in a standard table.
- Improvement path: Implemented `react-window` for virtualization in shared tables.

## Fragile Areas

**Deployment Pipeline:**
- Files: `deploy.ps1`
- Why fragile: Syntax sensitivity to quotes and encoding.
- Safe modification: Use simple command-line git triggers and verify webhook availability.

## Test Coverage Gaps

**Business Logic:**
- What's not tested: Complex filtering logic in `ComprasModule` and `AlmoxarifadoModule`.
- Risk: Changes to hierarchy logic could break visibility for entire departments.
- Priority: High.

---

*Concerns audit: 2026-05-03*
