# Bella Luxe Day Spa — Membership CRM

A premium luxury spa membership CRM dashboard built with Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, **Supabase (PostgreSQL + Auth + RLS)**, with **role-based access control** (admin / manager / receptionist / therapist).

## Design

**Luxury Wellness SaaS Dashboard** — refined palette of **dusty pink + burgundy + cream + warm gold**. Deep burgundy sidebar `#4A1C2E` with professional AI-generated Bella Luxe logo, cream/ivory background `#FAF6F2`, glass cards, Playfair Display serif for branding & quotes, Inter for UI.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| Charts | Recharts |
| Icons | lucide-react |
| **Database** | **Supabase (PostgreSQL)** — real cloud persistence |
| **Auth** | **Supabase Auth (email/password + signup + password reset)** |
| **Authorization** | **Role-based (admin/manager/receptionist/therapist) with RLS policies** |
| State | React Context + `router.refresh()` pattern |
| Toasts | sonner |
| Fonts | Playfair Display (serif) + Inter (sans) via next/font/google |
| Logo | AI-generated professional Bella Luxe lotus emblem |

---

## 🚀 SETUP (3 steps)

### Step 1 — Run the SQL schema on Supabase

1. Open your Supabase project dashboard: https://supabase.com/dashboard/project/wpdlculsoluvqbggodnq
2. Click **SQL Editor** → **New query**
3. Open `download/supabase-schema.sql` from this ZIP
4. Copy the entire contents into the SQL editor
5. Click **Run** (takes ~5 seconds)

This will:
- Create all 12 tables (profiles, members, membership_plans, memberships, services, staff, appointments, payments, package_offers, campaigns, notifications, activity_logs)
- Set up **role-based RLS policies** (admin/manager/receptionist/therapist each have different CRUD permissions per table)
- Add a Postgres function `current_user_role()` and a trigger that auto-creates a profile row whenever a new auth user signs up
- **Create the admin user** `admin@bellaluxe.com` with password `BellaLuxe@2026`
- Seed demo data: 12 members, 4 plans, 10 services, 6 staff, 5 appointments, 10 payments, 5 packages, 3 campaigns

### Step 2 — Set environment variables

The `.env` file is already configured:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wpdlculsoluvqbggodnq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_qkC7rX8nD1yN_UT50l-New_56IQD1rV
```

### Step 3 — Install and run

```bash
bun install          # or npm install
bun run dev          # or npm run dev
# Open http://localhost:3000
```

### Step 4 — Log in

The login page shows three tabs/modes:

- **Sign In** — email + password
- **Create Account** — for new team members (default role: Receptionist)
- **Forgot password?** — sends a Supabase password reset email

Use the admin credentials to start:

```
Email:    admin@bellaluxe.com
Password: BellaLuxe@2026
```

---

## 🎭 Role-Based Access Control

| Role | Dashboard | Members | Plans | Appointments | Services | Payments | Packages | Staff | Reports | Marketing | Settings |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **admin** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ✅ |
| **manager** | ✅ | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ | ✅ | ❌ |
| **receptionist** | ✅ | ✅ CRUD | read | ✅ CRUD | read | ✅ CRUD | read | ❌ | ❌ | ❌ | ❌ |
| **therapist** | ✅ | read | read | read+status | read | ❌ | read | ❌ | ❌ | ❌ | ❌ |

### How roles work

1. **Sidebar nav items are filtered by role** — therapists only see Dashboard, Appointments, Services
2. **Topbar shows role badge** — displays "Receptionist access" or "Therapist access" etc.
3. **Topbar dropdown shows role pill** — confirms current user's role
4. **RLS policies enforce at DB level** — even if a malicious user calls Supabase directly, RLS blocks unauthorized writes
5. **Server actions still work** — they run via the user's auth cookies, so RLS applies

### Changing a user's role

1. Open Supabase Dashboard → Table Editor → `profiles`
2. Find the user by email
3. Edit the `role` column to one of: `admin`, `manager`, `receptionist`, `therapist`
4. The user's next page load will reflect the new role

### Sign-up flow

New users can self-register via the **Create Account** tab:
1. They enter full name, email, password, and pick a role
2. Supabase creates the auth user
3. The trigger auto-creates a profile row with the chosen role
4. They can immediately log in (or after email confirmation if that's enabled in Supabase Auth settings)
5. Default role is `receptionist` if none selected — admins can upgrade via Supabase dashboard

### Password reset

Clicking "Forgot password?" on the login page:
1. User enters their email
2. Supabase sends a secure password reset email
3. User clicks the link in the email, sets a new password
4. User returns to the app and logs in with the new password

To enable password reset emails, ensure your Supabase project has email auth enabled (it is by default).

---

## Database Schema

The full SQL schema lives in `download/supabase-schema.sql`. Key tables:

```sql
-- Linked to auth.users — stores the SPA's business user accounts + roles
profiles (id, email, full_name, role, avatar_url, created_at)
  role ∈ ('admin', 'manager', 'receptionist', 'therapist')

-- CRM core
members (id, member_code, name, phone, email, gender, dob, address, photo_url, notes, created_at)
membership_plans (id, name, price, duration_days, sessions_included, discount_pct, benefits jsonb, is_active, created_at)
memberships (id, member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew, created_at)
  status ∈ ('Active', 'Expiring Soon', 'Expired')  -- computed from end_date
services (id, name, category, duration_min, price, is_active, created_at)
staff (id, name, role, specialization, commission_pct, working_hours jsonb, avatar_url, is_active, created_at)
appointments (id, member_id, service_id, staff_id, starts_at, ends_at, status, notes, created_at)
  status ∈ ('Booked', 'Completed', 'No-show', 'Cancelled', 'Pending', 'Confirmed')
payments (id, member_id, membership_id, appointment_id, amount, method, status, invoice_no, paid_at)
  method ∈ ('UPI', 'Card', 'Cash')  status ∈ ('Paid', 'Pending', 'Refunded')
package_offers (id, title, type, discount_value, discount_type, valid_from, valid_to, code, is_active, created_at)
campaigns (id, name, channel, template, segment jsonb, scheduled_at, status, created_at)
notifications (id, user_id, type, message, is_read, created_at)
activity_logs (id, user_id, action, entity, entity_id, created_at)
```

### Status logic (computed from end_date)

```sql
Active         : end_date > today + 30 days
Expiring Soon  : today ≤ end_date ≤ today + 30 days
Expired        : end_date < today
```

### Row Level Security (RLS) — role-based

- `profiles`: users can read/update only their own row (admins can read all)
- `members`, `memberships`, `appointments`, `payments`: admin/manager/receptionist have CRUD; therapist has read-only
- `membership_plans`, `services`, `package_offers`, `staff`, `campaigns`: admin/manager can edit; others read-only
- `notifications`: users see only their own notifications
- `activity_logs`: admin/manager can read; any authenticated user can insert

A Postgres helper function `public.current_user_role()` is used inside RLS policies to fetch the current user's role.

A trigger `on_auth_user_created` auto-creates a profile row whenever a new auth user signs up, defaulting to `receptionist` role unless the user specified one via signup metadata.

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│ User opens app                                           │
└──────────────────┬──────────────────────────────────────┘
                   ▼
        ┌──────────────────┐
        │ getServerUser()  │
        │ in page.tsx      │
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │   User exists?   │
        └────────┬─────────┘
           No   │     Yes
        ┌───────┴────────┐
        ▼                ▼
   LoginForm        Fetch user's role
   (login/signup/   from `profiles` table
   forgot)                 │
        │                   ▼
        ▼            Fetch all dashboard
   User signs in     data via server actions
        │                   │
        ▼                   ▼
   router.refresh() ───► SpaShell renders
                            with role-based
                            sidebar nav
```

---

## Features

### Auth + Login
- Three-mode login form: Sign In / Create Account / Forgot Password
- Sign-up captures full name + email + password + role (Receptionist / Therapist / Manager / Admin)
- Forgot password sends a Supabase reset email
- Pre-filled admin credentials on first load (admin@bellaluxe.com / BellaLuxe@2026)
- Auto-redirect to dashboard on successful login
- Logout from topbar dropdown
- Session persists across page reloads

### Role-Based Dashboard
- Sidebar nav filtered by role (therapist sees only 3 items, admin sees all 11)
- Role badge in sidebar ("admin access" / "receptionist access")
- Role pill in topbar dropdown
- RLS at DB level enforces permissions even if API is called directly

### Dashboard (11 sections)
1. **Hero** — "Welcome Back, {Role}!" + floating quick action buttons + spa quote with lotus divider
2. **4 KPI cards** — Total Members, Active Memberships, Expiring Soon, Total Revenue (computed from real Supabase aggregates)
3. **Recent Members** table — 6 most recent members with status pills, row actions (View, Edit, Renew, Send Reminder, Delete)
4. **Membership Overview** donut (Recharts) — Active / Expiring / Expired breakdown + Healthy Body Happier You promo banner
5. **Popular Membership Plans** — member count + revenue with progress bars
6. **Upcoming Expirations** — sorted by soonest
7. **Today's Appointments** — list with time, client, service, status
8. **Footer** — BELLA LUXE DAY SPA + More than a spa, a better you

### Members View
- Filterable/searchable table
- Add Member modal (creates Member + Membership + Payment in one transaction)
- Edit Member dialog, Renew Membership dialog (generates invoice)
- Send reminder (toast confirmation), Delete member (with confirmation)
- CSV export
- Click row → opens Member Profile Sheet (right drawer) with full history

### Membership Plans, Appointments, Services, Payments, Packages, Staff, Reports, Marketing, Settings
All views functional with full CRUD via Supabase. See earlier sections of this README for details.

---

## All Buttons Wired (Server Actions → Supabase)

Every button triggers a server action that mutates Supabase and then `router.refresh()` re-fetches fresh data. Toasts confirm every action.

| Action | Server Action |
|---|---|
| Add New Member | `createMember` |
| Edit Member | `updateMember` |
| Renew Membership | `renewMembership` |
| Send Reminder | `sendReminder` |
| Delete Member | `deleteMember` |
| Book Appointment | `createAppointment` |
| Update Appointment Status | `updateAppointmentStatus` |
| Create Invoice | `createPayment` |
| Refund Payment | `refundPayment` |
| Add/Edit/Delete Plan | `createPlan`, `updatePlan`, `deletePlan` |
| Toggle Plan Active | `togglePlan` |
| Add/Edit/Delete Service | `createService`, `updateService`, `deleteService` |
| Add/Edit/Delete Package | `createPackage`, `togglePackage`, `deletePackage` |
| Add/Edit/Delete Staff | `createStaff`, `updateStaff`, `deleteStaff` |
| Logout | `supabase.auth.signOut()` |
| Sign Up | `supabase.auth.signUp()` |
| Forgot Password | `supabase.auth.resetPasswordForEmail()` |

---

## File Structure

```
prisma/
  schema.prisma         # Prisma schema (legacy, kept as fallback)
  seed.ts                # Local SQLite seeder (legacy)
src/
  app/
    actions/             # Server actions (all use Supabase)
      dashboard.ts       # KPIs + aggregates
      members.ts         # Member CRUD + renew + sendReminder
      plans.ts, services.ts, appointments.ts
      payments.ts, packages.ts, staff.ts
      campaigns.ts, reports.ts
    page.tsx              # Server component — checks auth, fetches role + data
    layout.tsx           # Fonts + Toaster + favicon (uses /spa/logo.png)
    globals.css          # Refined dusty pink + burgundy + cream palette
  components/
    spa/
      SpaShell.tsx       # Client context + auth gate + role prop
      SpaLayout.tsx      # Layout shell
      LoginForm.tsx      # 3-mode login (sign in / sign up / forgot)
      Sidebar.tsx        # Burgundy sidebar + logo + role-filtered nav
      Topbar.tsx         # Glass topbar + role badge + logout
      Footer.tsx
      Hero.tsx, KpiCard.tsx, QuickActions.tsx
      RecentMembers.tsx, MembershipDonut.tsx
      PopularPlans.tsx, Expirations.tsx, TodayAppointments.tsx
      AddMemberDialog.tsx, BookAppointmentDialog.tsx
      CreateInvoiceDialog.tsx, MemberProfileSheet.tsx
      ViewSwitcher.tsx, Pills.tsx
      dialogs/
        EditMemberDialog.tsx, RenewMemberDialog.tsx
      views/
        DashboardView.tsx, MembersView.tsx
        PlansView.tsx, AppointmentsView.tsx, ServicesView.tsx
        PaymentsView.tsx, PackagesView.tsx, StaffView.tsx
        ReportsView.tsx, MarketingView.tsx, SettingsView.tsx
  lib/
    supabase.ts          # Browser + server Supabase clients
    supabase-server.ts   # getServerSupabase() + getServerUser()
    types.ts             # DTOs
    status.ts            # computeStatus helper
    format.ts            # INR + date formatters
public/
  spa/                   # 10 spa photos + 2 logos
    logo.png             # ← Professional AI-generated Bella Luxe logo (used in sidebar + favicon)
    logo-mark.png        # Smaller lotus mark only
    hero-spa.jpg
    towels-candles.jpg
    orchid-candle.jpg
    massage-stones.jpg
    spa-bowl.jpg
    wellness-banner.jpg
    spa-lobby.jpg
    spa-reception.jpg
    spa-interior.jpg
    spa-promo.jpg
download/
  supabase-schema.sql    # ← RUN THIS in Supabase SQL Editor first!
  bella-luxe-crm.zip     # This ZIP
  00-login.png           # Login page screenshot
  00c-forgot-password.png
  01-dashboard.png
  02-members.png
  05-reports.png
```

## Scripts

```bash
bun run dev          # Start dev server on port 3000
bun run build        # Production build
bun run lint         # ESLint check
```

## Verification

- ✅ `bun run lint` passes
- ✅ Login page renders with 3 modes (Sign In / Create Account / Forgot Password)
- ✅ Login error handling works (shows "Invalid login credentials" before SQL is run)
- ✅ Sign-up form has role selector (Receptionist / Therapist / Manager / Admin)
- ✅ Forgot Password form sends reset email via Supabase
- ✅ All 10 server action files use `getServerSupabase()`
- ✅ Sidebar filters nav items based on `userRole` prop
- ✅ Topbar shows role badge + role pill in dropdown
- ✅ Favicon uses the new professional logo
- ✅ Sidebar displays the new professional logo image
- ✅ Mobile responsive — sidebar collapses to drawer

## Refined Color Palette (Dusty Pink + Burgundy + Cream)

| Color | Hex | Usage |
|---|---|---|
| Deep Burgundy | `#4A1C2E` | Sidebar bg, primary |
| Darker Burgundy | `#3A1525` | Sidebar gradient bottom |
| Plum | `#5D2A3D` | Active nav pill bg |
| Cream | `#FAF6F2` | Page background |
| Cream Secondary | `#F5EDE3` | Muted backgrounds |
| Soft Blush Pink | `#F5D9DC` | Highlights, selected states |
| Dusty Pink | `#C99DA1` | Sidebar accents, active glow, button bg |
| Dusty Pink Deep | `#A67E84` | Hover state |
| Rose | `#D9708A` | Primary accent, progress bars |
| Mauve | `#8E4A63` | Mauve accent, button hover |
| Warm Gold | `#B8945A` | Premium accents, dividers |
| Sage Green | `#2E9E6E` | Active/success states |
| Warm Orange | `#E08A2E` | Warning/expiring states |
| Muted Red | `#C8413A` | Danger/expired states |
| Charcoal | `#1F2937` | Primary text |
| Muted Grey | `#6B7280` | Secondary text |

## License

Proprietary — Bella Luxe Day Spa
# Bella-Luxe-spa
# Bella-Luxe-spa
