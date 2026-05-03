# Technology Stack

**Analysis Date:** 2026-05-03

## Languages

**Primary:**
- TypeScript 5.x - Core application logic and UI components
- JavaScript (Node.js) - Scripting and configuration

**Secondary:**
- SQL - Supabase migrations and database schema definitions
- CSS (PostCSS) - Styling using Tailwind CSS v4

## Runtime

**Environment:**
- Node.js 20.x
- Next.js 16.2.4 (App Router)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.2.4 - Full-stack React framework
- React 19.2.4 - UI library

**Testing:**
- Jest 30.3.0 - Unit and integration testing
- React Testing Library 16.3.2 - UI component testing

**Build/Dev:**
- Tailwind CSS v4 - Styling
- ESLint 9.x - Linting
- PostCSS - CSS transformations

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` - Database and Auth integration
- `lucide-react` - Iconography
- `recharts` - Dashboard visualizations
- `jspdf` & `jspdf-autotable` - PDF report generation

**Infrastructure:**
- `tailwind-merge` & `clsx` - Dynamic styling
- `react-window` - Large list virtualization

## Configuration

**Environment:**
- Configured via `.env.local` and `.env.production`
- Uses Supabase URL and Anon Key for client-side access

**Build:**
- `next.config.ts`
- `tsconfig.json`
- `postcss.config.mjs`

## Platform Requirements

**Development:**
- Node.js 20+
- Git for version control

**Production:**
- Easypanel (VPS/Docker)
- GitHub (Main branch auto-deploy)

---

*Stack analysis: 2026-05-03*
