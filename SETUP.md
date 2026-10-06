# Bella Luxe Day Spa — CRM V2 (Supabase-only, no Prisma)

This is the updated V2 package of the Bella Luxe Day Spa CRM. It includes three new
features added on top of the original V1, AND has been fully converted from
**Prisma + SQLite** to **Supabase (Postgres)** as the only database.

## What's new in V2

### 0. Database: Prisma → Supabase
- All Prisma code removed (no `prisma/` folder, no `@prisma/client`, no `prisma` CLI)
- All server actions now use `@supabase/supabase-js` directly via `src/lib/supabaseServer.ts`
- Schema is defined entirely in `download/bella-luxe-spa-complete.sql`
- Row Level Security (RLS) is enabled on every table with role-based policies
- The service_role key (server-side) bypasses RLS so server actions can do CRUD

### 1. Daily Entries & Monthly Excel Report
- New sidebar entry **Daily Entries** — log every customer visit (member or walk-in)
  with service, therapist, amount, and payment mode
- New dashboard card **Today's Entries** with a one-click "Add New Entry" button
- New dashboard banner **Monthly Excel report is ready** — auto-shown at month-end
- New API route `GET /api/reports/monthly-excel?month=YYYY-MM` — streams an
  Excel-compatible `.xls` file (opens directly in Microsoft Excel / LibreOffice)
  containing all daily entries for the requested month, with totals row + summary block

### 2. Members Section & Quick Search
- **Members list removed from the dashboard** — members are now only accessible via
  the sidebar **Members** entry (per request)
- Topbar search box now wired up: typing a **name, phone, or membership ID** shows a
  popup with matching members; clicking a match opens the full member profile sheet
  (Edit / Renew / Send Reminder buttons all work end-to-end)

### 3. Staff Attendance Management + Salary Calculation
- New sidebar entry **Staff Attendance** with 3 tabs:
  - **Daily Marking** — date picker + 6 staff rows × 5 status buttons
    (Present / Half-Day / Absent / Leave / Holiday), one-click upsert
  - **Monthly Report** — month picker + date-wise pivot table (rows=staff, cols=days,
    color-coded status icons) + present/half/absent summary columns + CSV export
  - **Salary Calculation** — month picker + computed salary per staff
    (Present × perDay + Half-Day × perDay × 0.5) + total payable + CSV export
- New `per_day_salary` field on each Staff — editable in the Staff Management view
- Auto-archive: attendance records older than 60 days are auto-deleted by the
  `cleanupOldAttendance` server action (also has a manual "Archive Old Records" button)

## Setup instructions (Supabase only — no Prisma)

### Step 1: Set up the Supabase database

1. Open Supabase Dashboard → **SQL Editor** → **New Query**
2. Open `download/bella-luxe-spa-complete.sql`, copy the entire contents, and paste into the editor
3. Click **Run** (takes ~10 seconds — schema + RLS + seed data)
4. Verify in the Table Editor that you see 14 tables including `daily_entries` and `staff_attendance`
5. Note the admin login: `admin@bellaluxe.com` / `BellaLuxe@2026` (auto-created by the SQL)

### Step 2: Get your Supabase API keys

1. Supabase Dashboard → **Project Settings** → **API**
2. Copy the **Project URL** (e.g. `https://yourproject.supabase.co`)
3. Copy the **service_role** secret key (NOT the anon key — the service_role key bypasses RLS)
4. Copy the **anon** public key (used for client-side reads, RLS-protected)

### Step 3: Configure `.env`

Create a `.env` file in the project root with these four values:

```bash
# Server-side (bypasses RLS — never exposed to the browser)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Client-side (RLS-protected — exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Install & run

```bash
bun install        # install dependencies (no Prisma step needed)
bun run dev        # start dev server on http://localhost:3000
```

Open the app, log in with `admin@bellaluxe.com` / `BellaLuxe@2026`, and verify:
- Dashboard shows KPIs and the new "Today's Entries" card
- Sidebar shows **Daily Entries** and **Staff Attendance** entries
- Topbar quick search popup finds members by name / phone / membership ID

## What was removed (Prisma → Supabase migration)

- ❌ `prisma/schema.prisma` (deleted — schema is now in SQL)
- ❌ `prisma/seed.ts` (deleted — seed data is in the SQL file)
- ❌ `prisma/dev.db` (deleted — no local SQLite)
- ❌ `db/` folder (deleted)
- ❌ `scripts/check_db.ts` (deleted — no Prisma DB to check)
- ❌ `@prisma/client` and `prisma` from `package.json` (deleted)
- ❌ `bun run db:push`, `db:seed`, `db:generate`, `db:migrate`, `db:reset` scripts (deleted)
- ❌ All `import { db } from '@/lib/db'` references (replaced with `import { supabase } from '@/lib/supabaseServer'`)

## What was added

- ✅ `src/lib/supabaseServer.ts` — Supabase client (service role, bypasses RLS)
- ✅ `.env.example` — template showing the four required env vars
- ✅ `download/bella-luxe-spa-complete.sql` — single A-to-Z SQL setup file
- ✅ `download/README.md` — detailed schema / RLS / setup docs
- ✅ All server actions rewritten to use `supabase.from('table').select()/insert()/update()/delete()/upsert()`
- ✅ All API routes rewritten similarly
- ✅ `package.json` cleaned up — only `@supabase/supabase-js` and `@supabase/ssr` remain

## File structure (key files)

```
.env                                    ← your Supabase credentials (create from .env.example)
.env.example                            ← template with all required env vars

download/
  ├── bella-luxe-spa-complete.sql       ← THE single A-to-Z SQL file (run this in Supabase)
  └── README.md                         ← schema overview, RLS table, setup guide

src/lib/
  ├── supabaseServer.ts                 ← NEW — Supabase client (replaces db.ts)
  ├── types.ts                          ← DTOs (unchanged)
  ├── dates.ts                          ← date helpers (unchanged)
  ├── status.ts                         ← membership status helper (unchanged)
  ├── format.ts                         ← formatting helpers (unchanged)
  └── utils.ts                          ← cn() helper (unchanged)

src/app/
  ├── page.tsx                          ← fetches all data via Supabase (with safe fallback)
  ├── actions/                          ← all server actions rewritten for Supabase
  │   ├── members.ts, staff.ts, plans.ts, services.ts, appointments.ts
  │   ├── payments.ts, packages.ts, campaigns.ts, reports.ts, dashboard.ts
  │   ├── dailyEntries.ts (new), attendance.ts (new)
  └── api/
      ├── members/[id]/route.ts         ← rewritten for Supabase
      └── reports/monthly-excel/route.ts ← rewritten for Supabase

src/components/spa/                     ← all UI components (unchanged from V2)
  ├── views/DailyEntriesView.tsx       (NEW)
  ├── views/AttendanceView.tsx         (NEW, 3 tabs)
  ├── AddDailyEntryDialog.tsx          (NEW)
  ├── DailyEntriesCard.tsx             (NEW)
  ├── MonthlyReportBanner.tsx          (NEW)
  ├── Topbar.tsx                       (wired up quick member search popup)
  └── views/DashboardView.tsx          (removed RecentMembers, added new cards)
```

## Tech stack
- Next.js 16 (App Router) + TypeScript 5
- **Supabase (Postgres)** — only database
- Tailwind CSS 4 + shadcn/ui (New York style)
- Recharts for analytics
- Server Actions for all mutations
- Row Level Security on all tables (role-based: admin/manager/receptionist/therapist)
