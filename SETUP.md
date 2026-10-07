# Bella Luxe Day Spa — CRM V2 (Supabase only, no Prisma)

This is the **production-ready** V2 package of the Bella Luxe Day Spa CRM, fully
tested against a live Supabase project (37/37 QA tests passing).

## What's new in V2

### 0. Database: Prisma → Supabase (clean cut)
- All Prisma code removed (no `prisma/` folder, no `@prisma/client`, no `prisma` CLI)
- All server actions use `@supabase/supabase-js` directly via `src/lib/supabaseServer.ts`
- Schema is defined entirely in `download/bella-luxe-spa-complete.sql` (single A-to-Z file)
- Row Level Security (RLS) is enabled on every table with role-based policies
- **Two auth modes** (auto-detected from env vars):
  - **Service-role mode** (recommended for production) — uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
  - **Admin-login mode** (auto-fallback) — logs in as `admin@bellaluxe.com` via Supabase Auth and uses the admin's access token (RLS grants admin role full CRUD)

### 1. Daily Entries & Monthly Excel Report
- New sidebar entry **Daily Entries** — log every customer visit (member or walk-in)
  with service, therapist, amount, and payment mode
- New dashboard card **Today's Entries** with a one-click "Add New Entry" button
- New dashboard banner **Monthly Excel report is ready** — auto-shown at month-end
- New API route `GET /api/reports/monthly-excel?month=YYYY-MM` — streams an
  Excel-compatible `.xls` file (opens directly in Microsoft Excel / LibreOffice)

### 2. Members Section & Quick Search
- **Members list removed from the dashboard** — members are only accessible via
  the sidebar **Members** entry
- Topbar search box now wired up: typing a **name, phone, or membership ID** shows a
  popup with matching members; clicking a match opens the full member profile sheet

### 3. Staff Attendance Management + Salary Calculation
- New sidebar entry **Staff Attendance** with 3 tabs:
  - **Daily Marking** — date picker + staff rows × 5 status buttons (Present/Half-Day/Absent/Leave/Holiday)
  - **Monthly Report** — date-wise pivot table + summary columns + CSV export
  - **Salary Calculation** — auto-computed per staff (Present × perDay + Half-Day × perDay × 0.5)
- New `per_day_salary` field on each Staff — editable in the Staff Management view
- Auto-archive: attendance records older than 60 days are auto-deleted on every fetch

### 4. Set Salary by Admin (NEW)
- Dedicated sidebar entry **Set Salary (Admin)** — admin-only section
- Per-staff per-day salary editor with instant save per row + "Save All Changes" button
- Live salary preview for the current month (or any of the last 6 months)
- Summary cards: total staff, average per-day salary, total monthly payable, selected month
- Formula: `Salary = (Present × perDay) + (Half-Day × perDay × 0.5)`
- Connects directly to the `staff.per_day_salary` column in Supabase

### 5. Custom Logo & Brand Visual
- New logo (`/public/logo.png`, 500×500 with transparency) — the brand logo you uploaded
- Logo appears in:
  - Sidebar header (rounded, ringed, with shadow)
  - Topbar admin avatar (rounded, ringed)
  - Hero section quote divider (small)
  - Footer (small)
  - Browser tab favicon (`<link rel="icon" href="/logo.png">`)
- To replace: just drop a new `logo.png` in the `public/` folder — no code changes needed

### 6. Realtime Sync (NEW) — auto-updates without page refresh
The app now auto-refreshes from Supabase every 5 seconds (and gets instant updates
via Supabase Realtime when available). No manual page refresh needed — any change
made in Supabase (via the app, the Dashboard, or another browser tab) is reflected
in the UI within seconds.

- **5-second polling fallback** — calls `router.refresh()` (Next.js soft refresh,
  no full page reload) every 5 seconds to refetch all server action data
- **Supabase Realtime subscriptions** — when env vars are set, the client
  subscribes to all 14 tables for instant updates (INSERT / UPDATE / DELETE
  events) — works across browser tabs and from direct DB changes
- **Live indicator** in the topbar — green "Live" badge with pulsing dot when
  Realtime is connected, yellow "5s" badge when only polling is active
- **Window focus listener** — refreshes immediately when the user returns to
  the tab, catching any changes that happened while away
- All 14 tables are covered: profiles, members, membership_plans, memberships,
  services, staff, appointments, payments, package_offers, campaigns,
  notifications, activity_logs, daily_entries, staff_attendance

**Verified**: inserted a new member via Supabase REST API → UI updated Total
Members from 13 → 14 within 5 seconds (no page refresh). Toggle test: changed
`is_active` on a staff member via REST → switch flipped from "Active" to "On
Leave" in the UI within 5 seconds, then back to "Active" after reset.

## Setup instructions (3 steps)

### Step 1: Set up the Supabase database (single SQL file)

1. Open Supabase Dashboard → **SQL Editor** → **New Query**
2. Open `download/bella-luxe-spa-complete.sql`, copy the entire contents, and paste into the editor
3. Click **Run** (takes ~10 seconds — schema + RLS + seed data)
4. Verify in the Table Editor that you see 14 tables including `daily_entries` and `staff_attendance`
5. Note the admin login: `admin@bellaluxe.com` / `BellaLuxe@2026` (auto-created by the SQL)

### Step 2: Get your Supabase API keys

1. Supabase Dashboard → **Project Settings** → **API**
2. Copy the **Project URL** (e.g. `https://yourproject.supabase.co`)
3. Copy the **anon** public key (used for client-side reads, RLS-protected)
4. (Recommended for production) Copy the **service_role** secret key (bypasses RLS — never expose to the browser)

### Step 3: Configure `.env` and run

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# REQUIRED — fill these in
SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# RECOMMENDED for production — bypasses RLS for server actions
# If left empty, the app falls back to admin login (admin@bellaluxe.com / BellaLuxe@2026)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Then install and run:

```bash
bun install        # install dependencies (no Prisma step needed)
bun run dev        # start dev server on http://localhost:3000
```

Open the app and log in with `admin@bellaluxe.com` / `BellaLuxe@2026`.

## What was tested (37/37 QA tests passing)

The included QA test suite (`scripts/qa-test.ts`) was run against a live Supabase
project and verified:

✅ Admin login works
✅ All 14 tables exist with correct seed data (12 members, 4 plans, 12 memberships,
   10 services, 6 staff, 5 appointments, 10 payments, 5 packages, 3 campaigns,
   161 daily entries, 360 staff attendance records)
✅ All column names use correct snake_case (Postgres convention)
✅ Daily entries CRUD (create, update, delete) — verified data persists to Supabase
✅ Staff attendance CRUD + upsert (unique on staff_id+date) — verified data persists
✅ Auto-archive: 60-day-old records are auto-deleted
✅ Member CRUD (auto-generates member code BLM-XXX)
✅ Plan CRUD, Service CRUD, Staff CRUD (with per_day_salary), Package CRUD, Campaign CRUD
✅ Salary calculation correct: e.g. Aarti Kapoor: 3 Present + 2 Half-Day × ₹1200 = ₹4800
✅ Excel download API returns valid .xls file (HTTP 200, 132 entries, 90 name matches)
✅ Member detail API returns full member data with memberships, appointments, payments

## Tech stack
- Next.js 16 (App Router) + TypeScript 5
- **Supabase (Postgres)** — only database, no Prisma
- Tailwind CSS 4 + shadcn/ui (New York style)
- Recharts for analytics
- Server Actions for all mutations
- Row Level Security on all tables (role-based: admin/manager/receptionist/therapist)

## What was removed (Prisma → Supabase migration)
- ❌ `prisma/schema.prisma` (deleted — schema is now in SQL)
- ❌ `prisma/seed.ts` (deleted — seed data is in the SQL file)
- ❌ `prisma/dev.db` (deleted — no local SQLite)
- ❌ `db/` folder (deleted)
- ❌ `scripts/check_db.ts` (deleted — no Prisma DB to check)
- ❌ `@prisma/client` and `prisma` from `package.json` (deleted)
- ❌ `bun run db:push`, `db:seed`, `db:generate`, `db:migrate`, `db:reset` scripts (deleted)
- ❌ All `import { db } from '@/lib/db'` references (replaced with `import { getSupabase } from '@/lib/supabaseServer'`)

## File structure (key files)
```
.env.example                            ← template (fill in SUPABASE_URL + anon key + service_role key)
.env                                    ← your live credentials (don't commit this)

download/
  ├── bella-luxe-spa-complete.sql       ← THE single A-to-Z SQL file (run this in Supabase SQL Editor)
  └── README.md                         ← schema overview, RLS table, setup guide

scripts/
  ├── qa-test.ts                        ← QA test suite — run with `bun run scripts/qa-test.ts`
  ├── refactor.sh                       ← internal refactor script (kept for reference)
  └── refactor_supabase.py              ← internal refactor script (kept for reference)

src/lib/
  ├── supabaseServer.ts                 ← Supabase client (service_role OR admin-login fallback)
  ├── types.ts, dates.ts, status.ts, format.ts, utils.ts

src/app/
  ├── page.tsx                          ← fetches all data via Supabase (with safe fallbacks)
  ├── actions/                          ← all 12 server actions rewritten for Supabase
  │   ├── members.ts, staff.ts, plans.ts, services.ts, appointments.ts
  │   ├── payments.ts, packages.ts, campaigns.ts, reports.ts, dashboard.ts
  │   ├── dailyEntries.ts (V2 new), attendance.ts (V2 new)
  └── api/
      ├── members/[id]/route.ts         ← returns full member profile
      └── reports/monthly-excel/route.ts ← streams .xls file
```
