# Open Pilot Ledger (OPL) — Prototype Scaffold

This is a developer-ready scaffold consistent with the **Open Pilot Ledger – Specification (v1.0)**.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Next.js Route Handlers (JSON REST)
- **DB/ORM**: PostgreSQL + Prisma
- **Public API**: Read-only endpoints backed by `public_api` DB views
- **Dev**: Docker Compose (Postgres + Web), seeded demo data

## Quick start

```bash
cp .env.example .env.local
docker compose up --build
# open http://localhost:3000
```

Login/auth is not enforced in this scaffold (internal console is open) — add NextAuth or your SSO later.

## Scripts

- `docker compose up --build` — start db and app
- The app runs migrations and seeds automatically on boot
- Public API available under `/api/public/*`
- Private API available under `/api/private/*` (no auth gate yet)

## Public Data Export
- CSV: `/api/public/export.csv`
- JSON: `/api/public/export.json`

## Notes
- Core tables live in the default schema.
- Sanitised read-only **views** in the `public_api` schema match the spec's "public fields" and filter by `visibilityPublic = true` AND `publishedAt IS NOT NULL`.
- A Postgres **role** `opl_public_reader` is granted `SELECT` on the `public_api` views only.
- Map visualisation uses MapLibre with OSM tiles by default.
