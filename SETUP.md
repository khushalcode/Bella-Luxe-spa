# Bella Luxe Day Spa — CRM V2 (with Daily Entries & Staff Attendance)

This is the updated V2 package of the Bella Luxe Day Spa CRM. It includes three new
features added on top of the original V1:

## What's new in V2

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

## Setup instructions

### Quick start (local SQLite)
```bash
bun install
bun run db:push        # create SQLite schema
bun run db:seed        # seed demo data (162 daily entries + 360 attendance records)
bun run dev            # start dev server on http://localhost:3000
```

### Production setup (Supabase) — single SQL file

The complete Supabase database setup is in **one** SQL file:

```
download/bella-luxe-spa-complete.sql      (45 KB, 977 lines)
```

Steps:
1. Open Supabase Dashboard → SQL Editor → New Query
2. Open `download/bella-luxe-spa-complete.sql`, copy the entire contents, and paste into the editor
3. Click Run (takes ~10 seconds for the schema + seed data)
4. Verify in the Table Editor that you see 14 tables including `daily_entries` and `staff_attendance`
5. Update `.env` to point your `DATABASE_URL` at the Supabase Postgres connection string
6. Restart the app — admin login: `admin@bellaluxe.com` / `BellaLuxe@2026`

See `download/README.md` for the full schema overview, RLS table, salary formula,
auto-archive policy, and Excel endpoint documentation.

## Tech stack
- Next.js 16 (App Router) + TypeScript 5
- Prisma ORM (SQLite for dev, Postgres-compatible for Supabase)
- Tailwind CSS 4 + shadcn/ui (New York style)
- Recharts for analytics
- Server Actions for all mutations
- Row Level Security on all Supabase tables (role-based)

## File structure (key additions)
```
prisma/schema.prisma                    # added DailyEntry + StaffAttendance models + Staff.perDaySalary
prisma/seed.ts                          # added 162 daily entries + 360 staff attendance seed

src/lib/dates.ts                        # NEW — pure sync helpers (month/year helpers)
src/lib/types.ts                        # extended with DailyEntryDTO, StaffAttendanceDTO, StaffSalaryRow

src/app/actions/dailyEntries.ts         # NEW — CRUD + monthly report meta
src/app/actions/attendance.ts           # NEW — CRUD + salary + auto-archive (>60 days)
src/app/actions/dashboard.ts            # extended with today's entries + attendance KPIs
src/app/actions/staff.ts                # extended with perDaySalary field

src/app/api/reports/monthly-excel/route.ts  # NEW — Excel-compatible .xls download

src/app/page.tsx                        # fetches new server action data
src/components/spa/SpaShell.tsx         # added 'daily-entries' + 'attendance' view keys
src/components/spa/SpaLayout.tsx        # wired EditMemberDialog + RenewMemberDialog
src/components/spa/Sidebar.tsx          # added Daily Entries + Staff Attendance nav
src/components/spa/ViewSwitcher.tsx     # wired new views
src/components/spa/Topbar.tsx           # wired up quick member search popup
src/components/spa/views/DashboardView.tsx  # removed RecentMembers, added new cards
src/components/spa/views/DailyEntriesView.tsx  # NEW
src/components/spa/views/AttendanceView.tsx    # NEW (3 tabs)
src/components/spa/views/StaffView.tsx          # added per_day_salary field
src/components/spa/AddDailyEntryDialog.tsx     # NEW
src/components/spa/DailyEntriesCard.tsx       # NEW (dashboard card)
src/components/spa/MonthlyReportBanner.tsx    # NEW (dashboard banner)
```
