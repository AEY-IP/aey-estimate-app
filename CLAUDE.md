# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

- **NEVER run database migrations** (`db:migrate`, `db:deploy`, or any `prisma migrate` command) without explicit user approval. Always describe what the migration will do and wait for confirmation first.
- **NEVER deploy to production** (`git push`, `vercel deploy`, or any deployment command) without explicit user confirmation. Always show what will be deployed and ask before proceeding.

## Commands

```bash
npm run dev          # Start dev server on port 3004
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (TypeScript, no emit)

npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:deploy    # Run migrations (production)
npm run db:seed      # Seed database (tsx prisma/seed.ts)
```

TypeScript errors are ignored in production build (`ignoreBuildErrors: true` in next.config.js). Run `npm run type-check` separately to catch type issues.

## Architecture

**Next.js 14 App Router** with PostgreSQL via Prisma ORM, deployed on Vercel.

### Route Groups

- `src/app/(admin)/` — admin/manager UI (estimates, clients, templates, works, etc.)
- `src/app/(client)/` — client portal (read-only dashboard, documents, photos, schedule)
- `src/app/api/` — all REST API routes (Next.js Route Handlers)
- `src/app/designer/` — not used; designer pages live under `(admin)/designer/`

### Authentication — Two Separate Systems

1. **Staff auth** (`auth-session` cookie): base64-encoded JSON `{ id, role, username, name }`. Roles: `ADMIN`, `MANAGER`, `DESIGNER`.
2. **Client auth** (`client-token` cookie): JWT signed with `JWT_SECRET`. Type: `'client'`.

Both are checked in `middleware.ts`. Helper functions in `src/lib/auth.ts`: `checkAuth()` for staff, `checkClientAuth()` for clients.

**Role access summary:**
- `ADMIN` — full access to everything
- `MANAGER` — clients, estimates, acts, schedule; can apply templates but not create/edit them
- `DESIGNER` — restricted to `/designer/*` and `/api/designer/*` only; manages own clients and estimates
- `client` — `/client-dashboard/*` only; reads their own data

### Core Domain

The app is a **construction/renovation project management platform** for an interior company.

Key concepts:
- **Estimates** (`estimates`) — cost estimates broken down by rooms → work items + materials; support coefficients, templates, PDF export
- **Acts** (`acts`) — same structure as estimates but for completion acts (акты)
- **Clients** (`clients`) — central entity; linked to a manager, optional designer, optional client portal user
- **Templates** (`templates`) — reusable estimate room/work/materials structures
- **Works catalog** (`work_blocks` / `work_items`) — shared price list used in estimates and acts
- **Designer estimates** (`designer_estimates`) — separate estimate flow for DESIGNER role, with their own clients (`designer_clients`)
- **Client portal** — clients can view their project news, photos, documents, receipts, design files, schedule, and estimates marked `showToClient = true`

### File Storage

Yandex Cloud Object Storage (S3-compatible). Configured via env vars:
- `YC_STORAGE_REGION`, `YC_STORAGE_ENDPOINT`, `YC_STORAGE_BUCKET`
- `YC_STORAGE_ACCESS_KEY_ID`, `YC_STORAGE_SECRET_ACCESS_KEY`

Public files get a direct URL; private files get a signed URL via `getSignedDownloadUrl()` in `src/lib/storage.ts`.

### Key Shared Libraries

- `src/lib/auth.ts` — `checkAuth()`, `checkClientAuth()`, `getCurrentUser()`, role helpers
- `src/lib/storage.ts` — `uploadFile()`, `deleteFile()`, `getSignedDownloadUrl()`
- `src/lib/pdf-export.ts` — PDF generation for estimates (jsPDF + pdfkit)
- `src/lib/database.ts` / `lib/database.ts` — Prisma client singleton
- `src/lib/estimate.ts` — estimate calculation helpers
- `src/types/` — shared TypeScript types (`estimate.ts`, `auth.ts`, `client.ts`, `template.ts`, `designer-estimate.ts`)

### Required Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # Client JWT signing key
YC_STORAGE_REGION
YC_STORAGE_ENDPOINT
YC_STORAGE_BUCKET
YC_STORAGE_ACCESS_KEY_ID
YC_STORAGE_SECRET_ACCESS_KEY
```
