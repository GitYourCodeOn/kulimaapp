You are building FarmFlow — a multi-tenant Farm Management SaaS web application.

> Last updated: Phase 6 complete. Resume from Phase 7 — Farming Modules.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CURRENT BUILD STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Phase 1 — Foundation          COMPLETE
✅ Phase 2 — Auth & Registration COMPLETE
✅ Phase 3 — Admin Dashboard     COMPLETE
✅ Phase 4 — Onboarding Wizard   COMPLETE
✅ Phase 5 — App Shell           COMPLETE
✅ Phase 6 — Inbreeding Engine   COMPLETE
⬜ Phase 7 — Farming Modules
⬜ Phase 8 — Shared Modules
⬜ Phase 9 — Deployment

Do not re-build anything marked ✅. Pick up from Phase 7 unless told otherwise.

Design references: extract `stitch_farm_dashboard_desktop.zip` or use
`stitch_design_reference/README.md` (screen maps + Verdant Grid tokens in
`farmflow_meridian/DESIGN.md`).

Stack snapshot (through Phase 6):
- Next.js App Router, TypeScript, Tailwind, standalone output, shadcn/ui (Base UI)
- Postgres + Drizzle, Better Auth, MinIO (farm-scoped keys), rate limits + Zod on APIs
- Roles: superadmin (`platform_admins`), manager/worker (`users`); /admin, /platform
- Onboarding wizard, app shell (sidebar + mobile nav), dashboard
- /herd, /herd/[animalId] with LineageSection; /breeding with InbreedingChecker;
  lib/inbreeding.ts matches farmflow-v2.html
- Deployed to Dokploy at kulimaapp.org via Cloudflare DNS


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UI DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aesthetic: Apple simplicity × Stripe data density.
- Apple: generous whitespace, large confident type, no visual clutter,
  every element earns its place, smooth transitions.
- Stripe: clean data tables, tight information hierarchy, clear status
  indicators, professional but not corporate, dashboard-ready.

### Component Library

Always use shadcn/ui from @/components/ui/*.
Never build custom inputs, buttons, dialogs, selects, tables, or modals.

shadcn v2 uses @base-ui/react — NOT Radix. Use render prop, not asChild:
  <DialogTrigger render={<Button size="sm" />}>Open</DialogTrigger>
  <AlertDialogTrigger render={<Button variant="destructive" />}>Delete</AlertDialogTrigger>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>…</DropdownMenuTrigger>
  <AlertDialogCancel render={<Button variant="outline" />}>Cancel</AlertDialogCancel>

### Typography Scale

  Page titles        text-2xl font-bold tracking-tight
  Section headings   text-lg font-semibold
  Card titles        text-base font-medium
  Body               text-sm
  Captions / hints   text-xs text-muted-foreground

### Spacing & Layout

  Page max-width     max-w-4xl mx-auto
  Page padding       px-4 py-6 sm:px-6
  Section gaps       space-y-6
  Card internal      space-y-4
  Form field gaps    space-y-2 (label+input), gap-4 (grid)
  Grid layouts       grid gap-4 sm:grid-cols-2 lg:grid-cols-3

  Padding scale:
    4  → badges, pills
    6  → table cells, list items
    8  → form fields, card defaults
    12-16 → page sections, hero areas

### Colour Tokens

  Brand green        #166534
  Page background    bg-[#f7f9f7]
  Text primary       text-[#0f1f0f]
  Text secondary     text-muted-foreground
  Header border      border-[#e8ede8]
  Header bg          bg-white/90 backdrop-blur-sm

  Status badges (use Badge variant="outline" + className override):
    Active   → border-green-200 bg-green-50 text-green-700
    Invited  → border-amber-200 bg-amber-50 text-amber-700
    Inactive → border-red-200 bg-red-50 text-red-700
    Dry      → border-sky-200 bg-sky-50 text-sky-700
    Heifer   → border-violet-200 bg-violet-50 text-violet-700

### Shadows & Borders

  Cards              Use shadcn <Card> — no extra shadow at rest
  Hover              hover:shadow-md transition-shadow on interactive cards only
  Danger zones       border-destructive/40
  Dividers           <Separator /> from shadcn — never raw <hr>

### Header Pattern (all (app) pages)

  <header className="sticky top-0 z-30 flex items-center justify-between
    border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">

### Mobile-First Responsive

  - Stack vertically on mobile, grid on sm:/lg:
  - Tables: hidden sm:block with card-list fallback sm:hidden
  - Touch targets minimum 44px
  - Dialogs: sm:max-w-md
  - Pages: pb-24 on mobile for bottom nav thumb reach

### Toasts

  Use toast from sonner (Toaster already in root layout).
  toast.success() for confirmations, toast.error() for failures.
  Never alert() or window.confirm().

### Empty States

  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-sm text-muted-foreground">No records yet</p>
  </div>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MULTI-TENANT DATA ISOLATION  (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FarmFlow is a multi-tenant SaaS. Each farm is a fully isolated organisation.
No data may cross between farms — not in Postgres, not in MinIO, not in responses.

1. EVERY business table query filters by farmId.
   Use getTenant() from lib/tenant.ts to get the current user's farmId.
   Pass it into every Drizzle .where(eq(table.farmId, farmId)) call.
   No exceptions.

2. Cross-entity FK references must be same-farm validated.
   When writing sireId, damId, maleId, femaleId, or any FK to another
   business record, call assertSameFarm(entityId, farmId) from lib/tenant.ts.

3. MinIO keys must be farm-scoped.
   All file keys use prefix farms/{farmId}/.
   Use lib/storage.ts helpers — never construct S3 keys manually.

4. API routes must not leak cross-farm data.
   Lists → filter by farmId.
   Single records → verify farmId matches before returning.
   Creates → set farmId from tenant context, never from request body.

5. Better Auth tables (user, session, account, verification) are global by design.
   Tenancy is enforced in the app users table and all downstream queries.

6. Middleware does NOT resolve tenant.
   Middleware handles auth redirects and impersonation blocking only.
   Tenant resolution happens at the route level via getTenant().

7. users.farmId is NOT NULL with onDelete: cascade.
   Deleting a farm cascades to all its users and their data.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECURITY STANDARDS  (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Rate Limiting

lib/rate-limit.ts provides an in-memory sliding-window rate limiter.
Three presets — apply the correct one at the top of every new API route:

  auth     10 req / 60 s per IP   — /api/auth/*, sign-in, sign-up
  strict    5 req / 60 s per IP   — /api/register, /api/accept-invite, /api/admin/invite
  api      60 req / 60 s per IP   — general authenticated endpoints

Usage:
  import { rateLimit } from "@/lib/rate-limit"
  const blocked = rateLimit(req, "api")
  if (blocked) return blocked

Every new API POST/PATCH/PUT/DELETE handler MUST call rateLimit() as its first line.
GET-only read endpoints may use "api" or omit if behind auth + no abuse vector.

### Input Validation

lib/validation.ts contains Zod schemas for every API payload.
All user input MUST be validated via Zod .safeParse() before use.

Pattern for every mutation route:
  const parsed = someSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }
  const { field1, field2 } = parsed.data   // ← use parsed.data, never raw body

When adding a new API route, add a matching Zod schema to lib/validation.ts first.
Constrain string lengths (.min/.max), use .trim(), validate enums, bound numbers.

### Security Headers (next.config.ts)

Applied globally to all responses:
  Strict-Transport-Security   HSTS with preload
  X-Frame-Options             SAMEORIGIN (clickjacking protection)
  X-Content-Type-Options      nosniff (MIME-sniffing protection)
  Referrer-Policy             strict-origin-when-cross-origin
  Permissions-Policy          camera=(), microphone=(), geolocation=(self)
  X-XSS-Protection            1; mode=block
  X-DNS-Prefetch-Control      on

### Authentication & Session Security

- Better Auth handles session tokens, CSRF on its own routes, password hashing.
- Session cookies: httpOnly, sameSite=lax, secure in production.
- BETTER_AUTH_SECRET must be ≥ 32 chars, high-entropy, set in env only.
- Passwords: min 8 characters enforced by Zod (acceptInviteSchema).
- Invite tokens: 32 random bytes (crypto.randomBytes), expire after 48 hours.

### API Route Checklist (for every new route)

  1. rateLimit(req, preset) as first line
  2. getTenant() or requireSuperuser() for auth + tenant context
  3. Zod .safeParse() on all request body input
  4. .where(eq(table.farmId, farmId)) on every query
  5. Return minimal data — never expose internal IDs unnecessarily
  6. Wrap in try/catch, return structured { error } JSON with correct status codes
  7. Log server errors to console.error, never expose stack traces to client


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WIREFRAME REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

farmflow-v2.html is the complete UI wireframe and feature spec.
Before building any farming module or component, open it and extract:
- Component structure and data shapes for that module
- NAV_CONFIG tabs per farming type
- Inbreeding algorithm (getLineage, inbreedingCheck) — port exactly
- Chart types and layouts (AreaChart, BarChart, DonutChart, Spark)
- Colour tokens and spacing — translate to Tailwind + shadcn equivalents

Stitch exports: `stitch_design_reference/README.md` maps `screen.png` mocks
(dashboard, onboarding, breeding_checker, herd list, platform, etc.) to phases;
`farmflow_meridian/DESIGN.md` describes the Verdant Grid design language.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Framework     Next.js 14 — App Router, Server Actions, TypeScript
Styling       Tailwind CSS + shadcn/ui
Auth          Better Auth (email/password + invite flow)
Database      PostgreSQL via Drizzle ORM
Email         Nodemailer (MailHog locally → Stalwart/own SMTP in prod)
File Storage  MinIO (S3-compatible, self-hosted, farm-scoped keys)
Deployment    Dokploy on VPS — Docker Compose
Local Dev     Docker Compose — Postgres port 5434, MinIO ports 9002/9003


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

farmflow/
  app/
    (auth)/
      login/
      register/
      accept-invite/
      onboarding/              ✅ Phase 4
    (app)/
      layout.tsx               ✅ Phase 5 (sidebar + bottom nav)
      dashboard/
      herd/                    ✅ list + [animalId] detail + LineageSection
      breeding/                ✅ InbreedingChecker
      health/
      dairy/
      pigs/
      chickens/
      crops/
      reports/
      weather/
      documents/
      finance/
      admin/                   ✅ complete (manager-level)
      platform/                ✅ complete (superadmin-level)
  components/
    ui/                        ✅ 17 components installed
    lineage/
      InbreedingChecker.tsx    ✅ Phase 6
      InbreedingBanner.tsx     ✅ Phase 6
      LineageSection.tsx       ✅ Phase 6
    dairy/                     ← Phase 7
    pigs/                      ← Phase 7
    chickens/                  ← Phase 7
    crops/                     ← Phase 7
    shared/                    ← Phase 8
  lib/
    auth.ts                    ✅
    auth-client.ts             ✅
    tenant.ts                  ✅ getTenant, requireManager, requireSuperadmin, …
    impersonation.ts           ✅
    storage.ts                 ✅ farm-scoped MinIO
    email.ts                   ✅ Nodemailer
    inbreeding.ts              ✅ Phase 6 (wireframe parity)
    db/
      schema.ts                ✅ 16 tables, 8 enums
      index.ts                 ✅
  hooks/
    use-inbreeding.ts          ✅ Phase 6
    use-animals.ts             ← Phase 7
  middleware.ts                ✅


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA  (Drizzle / Postgres)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Better Auth (global, not tenant-scoped):
  user, session, account, verification

App tables (all include farmId, all queries must filter by it):
  farms              id, name, owner_id, farming_type, location, size_ha, created_at
  users              id, email, name, role, farm_id NOT NULL, created_at
  animals            id, farm_id, name, species, breed, sex, dob, role, status,
                     sire_id→animals, dam_id→animals, weight, notes
  breeding_records   id, farm_id, male_id, female_id, date, outcome, litter_size, notes
  health_records     id, animal_id, farm_id, event_type, date, notes, treated_by
  milk_records       id, farm_id, date, session (AM|PM), total_litres
  flocks             id, farm_id, name, type (Layer|Broiler|Breeder), breed,
                     count, hen_house_no, dob, status, egg_day, avg_weight, mortality
  fields             id, farm_id, name, size_ha, soil_type, crop, variety,
                     plant_date, harvest_est, status, irrigated
  harvest_records    id, field_id, farm_id, date, crop, quantity, unit, price_per_unit
  documents          id, farm_id, name, type, storage_key, uploaded_at
  invites            id, farm_id, email, role, token, expires_at, accepted_at
  impersonation_logs id, admin_id, impersonated_user_id, farm_id,
                     started_at, ended_at, reason


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLE SYSTEM (3-tier)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Superadmin  Platform-level. Lives in `platform_admins` table (not in `users`).
            Can list all farms/orgs, create new farms, invite users to any farm,
            impersonate any user across any farm (read-only while active).
            Has access to /platform page. Created via CLI:
              npm run db:seed-admin <email>

Manager     Farm-level admin. Stored in `users.role = "manager"`.
            Full access to their farm's data. Can invite workers, manage team,
            edit farm settings via /admin. Cannot access other farms.

Worker      Farm-level. Stored in `users.role = "worker"`.
            Read + limited write (log health events, record milk sessions).
            No finance, no admin, no /platform.

Key files:
  - lib/tenant.ts — getTenant(), requireManager(), requireSuperadmin(), isSuperadmin(),
    getPlatformAdmin() (returns null if not superadmin; does not throw)
  - lib/db/schema.ts — `platformAdmins` table, `userRoleEnum` = ["manager", "worker"]
  - lib/validation.ts — `managerInviteSchema` (farm admin → workers only),
    `platformInviteSchema` (superadmin invites manager or worker)
  - scripts/seed-superadmin.ts — CLI to promote a user to superadmin

Platform vs farm admin APIs:
  - POST /api/platform/farms — creates the farm with `ownerId` set to the acting superadmin
    as a placeholder, inserts a manager invite, sends email; the first manager accepts via
    /accept-invite, which creates their `users` row and, when appropriate, updates `farms.ownerId`.
  - POST /api/admin/invite — managers only; payload must match `managerInviteSchema` (worker role).
  - POST /api/platform/invite — superadmin only; manager or worker per `platformInviteSchema`.

Existing databases: before `drizzle-kit push` if any `users.role` still uses the removed enum
value `superuser`, run:
    UPDATE users SET role = 'manager' WHERE role::text = 'superuser';
  or run `npm run db:seed-admin <email>` first (that script performs the same update).

Enforce at two layers:
  1. middleware.ts — route-level redirect
  2. API routes — re-check role with requireManager() or requireSuperadmin()


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INBREEDING ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Port exactly from farmflow-v2.html. Full TypeScript types required.

// lib/inbreeding.ts
export type InbreedingLevel = "critical" | "warning" | "safe"

export interface InbreedingResult {
  level: InbreedingLevel
  msg: string
  commonAncestors: string[]
}

Logic:
  Gen 1 — parent-offspring              → CRITICAL ⛔  (block)
  Gen 2 — full siblings (same sire+dam) → CRITICAL ⛔  (block)
  Gen 2 — half siblings (shared sire/dam) → CRITICAL ⛔ (block)
  Gen 3 — common ancestors              → WARNING ⚠️   (advisory)
  None  — no shared ancestry            → SAFE ✅

UI:
  critical → bg-red-50 border-red-300 text-red-800
  warning  → bg-amber-50 border-amber-300 text-amber-800
  safe     → bg-green-50 border-green-300 text-green-700

External sires/dams are prefixed EXT_ — skip them in lineage traversal.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD ORDER  (resume from Phase 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

─── PHASE 4 — Onboarding Wizard ────────────────────────

/onboarding — 3-step wizard using shadcn Card + stepper pattern:
  Step 1  Farm type selection — 4 cards (Dairy / Pigs / Chickens / Crops)
          Large icon, bold label, muted description. Selected = green ring.
  Step 2  Farm details — name, location, size_ha (pre-filled if set at register)
  Step 3  First entry — adapts by farm type:
            Dairy    → add first cow (name, breed, dob)
            Pigs     → add first pig (name, breed, role)
            Chickens → add first flock (name, type, count)
            Crops    → add first field (name, crop, size_ha)

Skip wizard entirely if the farm already has animals/flocks/fields in the DB.


─── PHASE 5 — App Shell ────────────────────────────────

app/(app)/layout.tsx:

Desktop sidebar (220px, white, border-r border-[#e8ede8]):
  - Logo + farm name + farming type badge at top
  - Nav items per NAV_CONFIG for the farm's farming_type
  - Active item: bg-[#e8f5e8] text-[#166534] font-semibold
  - Hover: bg-[#f0f7f0]
  - Bottom: user avatar + name + role + sign out

Mobile bottom nav (5 primary tabs from NAV_CONFIG + "More" popover):
  - Fixed bottom, border-t, white bg
  - Active icon: text-[#166534]

Topbar (sticky, all pages):
  - Page title left, notification bell + user avatar right
  - bg-white/90 backdrop-blur-sm border-b border-[#e8ede8]

Impersonation banner (already built — renders above topbar when active).

NAV_CONFIG is defined in farmflow-v2.html — extract it for routing logic.
Farming-type-aware: read farmType from the farm record via getTenant().


─── PHASE 6 — Inbreeding Engine ────────────────────────

lib/inbreeding.ts           Full TypeScript implementation (see spec above)
hooks/use-inbreeding.ts     Client hook wrapping inbreedingCheck

components/lineage/InbreedingChecker.tsx
  - Two shadcn Select dropdowns (male + female)
  - Real-time InbreedingBanner below on selection
  - Used in: Dairy Breeding, Pig Breeding, Chicken Breeders

components/lineage/InbreedingBanner.tsx
  - Alert-style card with level-appropriate colours
  - Shows message + lists common ancestors if any

components/lineage/LineageSection.tsx
  - Shows parent buttons (clickable if on-farm, muted if EXT_)
  - Shows offspring chips (navigate to animal detail)
  - Rendered at bottom of every animal detail page


─── PHASE 7 — Farming Modules ──────────────────────────

Reference farmflow-v2.html for every component before building.
Use shadcn Table (desktop) + card list (mobile) for all lists.
All data via Server Actions — never fetch() from client.

20. Dairy
      /dairy/herd        Cow list + inline quick-add sheet + CowDetail drawer
      /dairy/breeding    InbreedingChecker + breeding record log table
      /dairy/health      Vaccination schedule + health event log
      /dairy/ops         Milking sessions AM/PM + feed management

21. Pigs
      /pigs/herd         Pig list + PigDetail with LineageSection
      /pigs/breeding     InbreedingChecker + risky pairs panel + litter records
      /pigs/production   Farrowing stats + FCR table

22. Chickens
      /chickens/flocks   Flock list + inline add
      /chickens/breeders Breeding bird list + InbreedingChecker + BirdDetail
      /chickens/eggs     Production chart + hatch records

23. Crops
      /crops/fields      Field list + FieldDetail sheet
      /crops/planting    Schedule + rotation plan
      /crops/harvest     Records table + revenue chart
      /crops/inputs      Fertilizer + spray records


─── PHASE 8 — Shared Modules ───────────────────────────

All shared tabs adapt content by farming type (read from getTenant()).

/health      Vaccination schedule + health event log
/reports     Report cards with preview sparklines + Export PDF button
/weather     5-day forecast cards + farm alert banners
/documents   File list + MinIO presigned PUT upload (use lib/storage.ts)
/finance     Revenue vs expenses bar chart + net profit area chart
             + expense breakdown donut + 6-month table


─── PHASE 9 — Deployment ───────────────────────────────

Dockerfile already scaffolded (Next.js standalone output).
Steps:
  1. Push to Dokploy — app + Postgres + MinIO service containers
  2. Set all env vars in Dokploy dashboard
  3. SSL + domain via built-in Traefik proxy
  4. Smoke test end-to-end:
     Register → invite → accept → onboarding →
     farming module → inbreeding check → impersonate → end session


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE CONVENTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- New components → /components/[module]/ComponentName.tsx
- Server Actions → /app/(app)/[route]/actions.ts
- No any types — always define TypeScript interfaces
- Every Drizzle query includes .where(eq(table.farmId, farmId))
- Run drizzle-kit push after schema changes — never edit migrations manually
- Do not install new packages without confirming first

Before writing any component:
  1. Check if it exists in farmflow-v2.html
  2. Check if the type exists in lib/db/schema.ts
  3. Check if the shadcn component is already installed in /components/ui/