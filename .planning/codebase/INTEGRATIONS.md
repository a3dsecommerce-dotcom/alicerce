# External Integrations

**Analysis Date:** 2026-05-03

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Primary database, authentication, and real-time features
  - SDK/Client: `@supabase/supabase-js`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Communication:**
- n8n - Workflow automation and external triggers (WhatsApp/Email)
  - Implementation: Webhook triggers via `fetch`

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: REST API via Supabase SDK
  - Client: `supabase-js` client initialized in `lib/supabase.ts`

**File Storage:**
- Supabase Storage - User uploads and documents

**Caching:**
- Next.js fetch cache - Default server-side caching

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: JWT-based authentication with session persistence in `localStorage` and server-side verification in `middleware.ts`.

## Monitoring & Observability

**Error Tracking:**
- Console logging (current)

**Logs:**
- Custom logging system integrated into `GerenciaModule.tsx` and saved to Supabase `logs` table.

## CI/CD & Deployment

**Hosting:**
- Easypanel (Docker-based VPS)

**CI Pipeline:**
- GitHub Actions / Webhooks - Auto-deploy on push to `main`.

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `EASYPANEL_WEBHOOK_URL` (optional for manual deploy)

**Secrets location:**
- Easypanel environment variables manager.

## Webhooks & Callbacks

**Incoming:**
- `/api/candidatos` - Recruitment portal submissions

**Outgoing:**
- n8n webhooks for notifications

---

*Integration audit: 2026-05-03*
