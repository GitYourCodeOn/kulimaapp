## File conventions
- All new components go in /components/[module]/
- Server Actions go in /app/(app)/[route]/actions.ts
- Never use `any` type — always define proper TypeScript interfaces
- Drizzle queries always include a `.where(eq(table.farmId, farmId))` guard
- Run `drizzle-kit push` after any schema change, never edit migrations manually

## Before writing code
- Check if the component already exists in farmflow-v2.html
- Check if the type already exists in lib/db/schema.ts
- Do not install new packages without confirming first

You are building FarmFlow — a multi-tenant Farm Management SaaS web application.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WIREFRAME REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`farmflow-v2.html` is the complete UI wireframe and feature specification.
Extract and reference it for:
- All 4 farming modules: Dairy, Pigs, Chickens, Crops
- The inbreeding detection algorithm (getLineage, inbreedingCheck)
- NAV_CONFIG navigation structure per farming type
- All entity data shapes (animals, flocks, fields, etc.)
- Component names, layouts, chart styles, and colour tokens


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework:    Next.js 14 — App Router, Server Actions, TypeScript
Styling:      Tailwind CSS + shadcn/ui
Auth:         Better Auth (email/password + email invite flow)
Database:     PostgreSQL via Drizzle ORM
Email:        Resend (via Better Auth email adapter — swap to own SMTP later, one line)
File Storage: MinIO (S3-compatible, self-hosted)
Deployment:   Dokploy on VPS (Docker Compose)
Local Dev:    Docker Compose — Postgres + MinIO containers


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

farmflow/
  app/
    (auth)/
      login/
      register/
      accept-invite/         # token validation + set password
      onboarding/            # 3-step wizard
    (app)/
      layout.tsx             # sidebar (desktop) + bottom nav (mobile)
      dashboard/
      herd/
      breeding/
      health/
      dairy/
      pigs/
      chickens/
      crops/
      reports/
      weather/
      documents/
      finance/
      admin/                 # superuser only
  components/
    ui/                      # shadcn base components
    lineage/
      InbreedingChecker.tsx
      InbreedingBanner.tsx
      LineageSection.tsx
    dairy/
    pigs/
    chickens/
    crops/
    shared/                  # HealthTab, WeatherTab, DocumentsTab, FinanceTab
  lib/
    auth.ts                  # Better Auth config
    db/
      schema.ts              # Drizzle schema (all tables)
      index.ts               # db client
    inbreeding.ts            # getLineage + inbreedingCheck with TypeScript types
    email.ts                 # Resend adapter
    storage.ts               # MinIO client
  hooks/
    use-inbreeding.ts
    use-animals.ts
  middleware.ts              # Auth guard + farm_id tenant injection


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA  (Drizzle / Postgres)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

farms
  id, name, owner_id, farming_type, location, size_ha, created_at

users
  id, email, name, role (superuser | manager | worker), farm_id, created_at

animals
  id, farm_id, name, species, breed, sex, dob, role, status,
  sire_id → animals.id, dam_id → animals.id,
  weight, notes

breeding_records
  id, farm_id, male_id, female_id, date, outcome, litter_size, notes

health_records
  id, animal_id, farm_id, event_type, date, notes, treated_by

milk_records
  id, farm_id, date, session (AM | PM), total_litres

flocks
  id, farm_id, name, type (Layer | Broiler | Breeder), breed,
  count, hen_house_no, dob, status, egg_day, avg_weight, mortality

fields
  id, farm_id, name, size_ha, soil_type, crop, variety,
  plant_date, harvest_est, status, irrigated

harvest_records
  id, field_id, farm_id, date, crop, quantity, unit, price_per_unit

documents
  id, farm_id, name, type, storage_key, uploaded_at

invites
  id, farm_id, email, role, token, expires_at, accepted_at

impersonation_logs             ← audit trail for admin impersonation
  id, admin_id, impersonated_user_id, farm_id, started_at, ended_at, reason


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH — BETTER AUTH CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/auth.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "FarmFlow <noreply@yourdomain.com>",
        to: user.email,
        subject: "Verify your FarmFlow account",
        html: `<a href="${url}">Verify Email</a>`
      })
    }
  }
})

Session strategy: database sessions stored in Postgres
Multi-tenancy:    all DB queries filter by farm_id (enforced in query layer, not RLS)
SMTP migration:   swap Resend for nodemailer in lib/email.ts — one config change,
                  Better Auth's email adapter abstracts the transport


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCAL DEV — DOCKER COMPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: farmflow
      POSTGRES_USER: farmflow
      POSTGRES_PASSWORD: localdev
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: ["miniodata:/data"]

volumes:
  pgdata:
  miniodata:

# .env.local
DATABASE_URL=postgresql://farmflow:localdev@localhost:5432/farmflow
BETTER_AUTH_SECRET=change-me-in-production
RESEND_API_KEY=re_xxxxxxxxxxxx
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
NEXT_PUBLIC_APP_URL=http://localhost:3000


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INBREEDING ENGINE  (port exactly from wireframe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// lib/inbreeding.ts
export type InbreedingLevel = "critical" | "warning" | "safe"

export interface InbreedingResult {
  level: InbreedingLevel
  msg: string
  commonAncestors: string[]
}

export const getLineage = (
  id: string,
  animals: Animal[],
  depth = 3,
  visited = new Set<string>()
): Set<string> => {
  // Recursively collect ancestor IDs up to `depth` generations
  // Skip external sires/dams prefixed with "EXT_"
}

export const inbreedingCheck = (
  maleId: string,
  femaleId: string,
  animals: Animal[]
): InbreedingResult | null => {
  // Gen 1 — parent-offspring → CRITICAL ⛔ (block breeding)
  // Gen 2 — full siblings (same sire AND dam) → CRITICAL ⛔
  // Gen 2 — half siblings (shared sire OR dam) → CRITICAL ⛔
  // Gen 3 — common ancestors within 3 generations → WARNING ⚠️ (advisory)
  // None   → SAFE ✅
}

// UI rendering:
// critical → red border + bg-red-50 + ⛔ message
// warning  → amber border + bg-amber-50 + ⚠️ message
// safe     → green border + bg-green-50 + ✅ message


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

superuser   Full access. /admin, invite/remove users, edit farm settings,
            impersonate any user on their farm for debugging.

manager     All farming modules (herd, breeding, health, dairy/pigs/chickens/crops,
            reports, documents, finance). No /admin.

worker      Read + limited write only (log health events, record milk sessions).
            No finance tab, no admin tab.

Enforce at two layers:
  1. middleware.ts — route-level redirect for role violations
  2. Server Actions — re-check role before any data mutation


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

─── PHASE 1 — Foundation ───────────────────────────────

1.  Scaffold
    npx create-next-app@latest farmflow --typescript --tailwind --app

2.  Install dependencies
    better-auth better-auth/adapters/drizzle
    drizzle-orm drizzle-kit pg
    resend
    @aws-sdk/client-s3 (MinIO S3-compatible)
    shadcn/ui zod

3.  Start local services
    docker compose up -d

4.  Create all Drizzle tables
    drizzle-kit push

5.  Wire Better Auth
    lib/auth.ts + app/api/auth/[...all]/route.ts + middleware.ts


─── PHASE 2 — Super User Registration & Farm Creation ──

6.  /register — first registration becomes superuser
    Fields: name, email, password, farm name, farming type, location
    On submit:
      - Create farm row
      - Create user row with role=superuser
      - Attach farm_id to session

7.  /login — email/password via Better Auth

8.  middleware.ts
    Every /app/* route: check session → redirect to /login if missing
    Attach farm_id + role to request context for downstream use


─── PHASE 3 — Admin Dashboard (build BEFORE farming modules) ───

9.  /app/admin — superuser only (middleware redirects others)

10. User Management table
    - List all farm users: name, email, role, status (Active / Invited)
    - Inline role change dropdown (manager / worker / vet)
    - Deactivate / remove user (with confirmation modal)

11. Invite User modal
    - Inputs: email + role
    - Creates invite row: signed token + 48h expiry
    - Sends Resend email with link: /accept-invite?token=xxx
    - Shows pending invite in user table with "Invited" badge

12. /accept-invite?token=xxx
    - Validate token (not expired, not already accepted)
    - Form: set display name + password
    - On submit: create user, mark invite accepted, redirect to /onboarding

13. Farm Settings panel
    - Edit: farm name, location, size_ha, farming type
    - Danger zone: deactivate farm (soft delete, requires typing farm name to confirm)

14. User Impersonation (superuser debugging tool)
    - "Impersonate" button next to each user in the user table
    - On click: create an impersonation session scoped to that user's role + farm_id
    - Persistent banner shown across all pages while impersonating:
      "⚠️ Impersonating [User Name] — viewing as [role]  [End Session]"
    - All actions during impersonation are read-only (no data mutations allowed)
    - On "End Session": restore original superuser session
    - Every impersonation start + end is logged to impersonation_logs table
      (admin_id, impersonated_user_id, farm_id, started_at, ended_at, reason)
    - Reason field: optional text input before starting ("e.g. debugging invite flow")


─── PHASE 4 — Onboarding Wizard ────────────────────────

15. 3-step wizard at /onboarding
    Step 1: Farm type selection (Dairy / Pigs / Chickens / Crops)
    Step 2: Farm details (name, location, size)
    Step 3: Add first animal/flock/field (adapts to farm type)

16. Skip wizard if farm already has data (returning user check)


─── PHASE 5 — App Shell ────────────────────────────────

17. app/(app)/layout.tsx
    Desktop: 220px white sidebar with NAV_CONFIG tabs per farming type
    Mobile:  bottom tab bar (5 primary + "More" overflow popover)
    Topbar:  page title + notification bell + user avatar
    Farming-type-aware: reads farmType from farm record to render correct nav


─── PHASE 6 — Inbreeding Engine ────────────────────────

18. lib/inbreeding.ts — port getLineage + inbreedingCheck with full TypeScript types
19. components/lineage/InbreedingChecker.tsx — reusable live checker component
    (male selector + female selector → real-time result banner)
    Used across Dairy breeding tab, Pig breeding tab, Chicken breeders tab


─── PHASE 7 — Farming Modules ──────────────────────────

20. Dairy
    - Herd (cow list + inline quick-add + CowDetail with LineageSection)
    - Breeding (InbreedingChecker + breeding record log)
    - Health (vaccination schedule + health event log)
    - Dairy Ops (milking sessions + feed management)

21. Pigs
    - Herd (pig list + PigDetail with LineageSection)
    - Breeding (InbreedingChecker + known risky pairs panel + litter records)
    - Production (farrowing stats + FCR table)

22. Chickens
    - Flocks (flock list + inline add)
    - Breeders (breeding birds + InbreedingChecker + BirdDetail with LineageSection)
    - Eggs (production chart + hatch records)

23. Crops
    - Fields (field list + FieldDetail)
    - Planting (schedule + crop rotation plan)
    - Harvest (records table + revenue chart)
    - Inputs (fertilizer + spray records)


─── PHASE 8 — Shared Modules ───────────────────────────

24. Health tab    — shared across all farming types (adapts content by type)
25. Reports tab   — report cards with export PDF action
26. Weather tab   — 5-day forecast + farm alerts
27. Documents tab — file list + MinIO upload (presigned PUT URL)
28. Finance tab   — revenue vs expenses chart + net profit trend + expense breakdown


─── PHASE 9 — Deployment ───────────────────────────────

29. Dockerfile
    FROM node:20-alpine AS builder ... (Next.js standalone output)

30. Verify on Dokploy
    - App container + Postgres service + MinIO service
    - Set all env vars in Dokploy dashboard
    - Domain + SSL via Dokploy's built-in Traefik proxy

31. Smoke test the full invite flow end-to-end in production:
    Register superuser → invite manager → accept invite →
    onboarding → farming module → impersonate → end session


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- next.config.js: output: "standalone" for minimal Docker image
- Dokploy runs Postgres + MinIO as managed service containers alongside the app
- SMTP migration path: update lib/email.ts transport from Resend to nodemailer
  — Better Auth's email adapter abstracts this, farming modules are unaffected
- All multi-tenancy enforced via farm_id query filters (no Postgres RLS needed)
- Local dev mirrors production exactly via Docker Compose