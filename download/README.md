# Bella Luxe Day Spa — CRM Database Deliverable

This folder contains the **single, complete SQL file** needed to set up the entire
Bella Luxe Day Spa CRM database in Supabase, including all V2 features:

- **Daily Entries** — customer walk-in / member visit log + monthly Excel report
- **Staff Attendance** — per-day attendance with monthly report + salary calculation
- **Per-day salary** on each staff member

## File

| File | Purpose |
| --- | --- |
| `bella-luxe-spa-complete.sql` | **Complete A-to-Z setup.** Single file. Drops and recreates all 14 tables, RLS policies, triggers, admin user, and full seed data. Run this once and the database is fully ready. |

## How to use

1. Open the Supabase Dashboard for your project → **SQL Editor** → **New Query**
2. Open `bella-luxe-spa-complete.sql`, copy the entire contents, and paste into the editor
3. Click **Run** (it takes ~10 seconds — there's a lot of seed data)
4. Verify in the **Table Editor** that you see 14 tables including `daily_entries` and `staff_attendance`
5. Update your app's `DATABASE_URL` to point to your Supabase Postgres connection string (e.g. `postgresql://postgres.<ref>:<password>@<ref>.supabase.co:5432/postgres`)
6. Restart the app — admin login: `admin@bellaluxe.com` / `BellaLuxe@2026`

**Note:** This script is idempotent but **destructive on re-run** — it drops and recreates
all tables. If you need to preserve data on a re-run, comment out the "CLEANUP"
section at the top of the file before running it again.

## Schema overview

### Tables (14 total)

| Table | Purpose |
| --- | --- |
| `profiles` | Auth-linked user profile with role (admin/manager/receptionist/therapist) |
| `members` | CRM members (with member_code, name, phone, email, gender, dob, address, notes) |
| `membership_plans` | Available membership plans |
| `memberships` | Active memberships linking members to plans |
| `services` | Spa services (massage, facial, etc.) |
| `staff` | Staff members with role, commission, **per_day_salary** (V2), working hours |
| `appointments` | Booked appointments |
| `payments` | Payment records with invoice numbers |
| `package_offers` | Discount packages / coupons |
| `campaigns` | Marketing campaigns |
| `notifications` | User notifications |
| `activity_logs` | Audit trail |
| **`daily_entries`** (V2) | Customer visit log — drives the monthly Excel report |
| **`staff_attendance`** (V2) | Per-day attendance with unique constraint on (staff_id, date) |

### Row Level Security

All tables have RLS enabled. Roles grant the following access:

| Role | Access |
| --- | --- |
| `admin` | Full CRUD on everything |
| `manager` | Full CRUD on everything except user profile management |
| `receptionist` | Read+Create+Update on members, appointments, payments, packages, daily_entries, staff_attendance |
| `therapist` | Read-only on most tables; full read on appointments & staff_attendance |

## Salary calculation (V2)

The `Staff Attendance` view's **Salary Calculation** tab computes each staff member's monthly salary using:

```
Computed Salary = (Present days × per_day_salary)
                + (Half-Day days × per_day_salary × 0.5)
```

- **Present** = full per-day salary
- **Half-Day** = 0.5 × per-day salary
- **Absent / Leave / Holiday** = ₹0 (not counted as payable days)

Set each staff member's per-day salary in the **Staff Management** view or directly in the `staff.per_day_salary` column.

## Auto-archive

The `staff_attendance` table is automatically pruned by the app's `cleanupOldAttendance` server action — any record older than **60 days** is deleted the next time attendance is fetched. This keeps the table lean and aligns with the retention policy.

You can also trigger this manually via the **Archive Old Records** button in the Staff Attendance view.

## Monthly Excel report

The app exposes a `GET /api/reports/monthly-excel?month=YYYY-MM` endpoint that streams an Excel-compatible `.xls` file with all daily entries for the requested month, including a summary block with totals by payment mode and walk-in count. This file opens directly in Microsoft Excel and LibreOffice without conversion.

## Seed data summary

The complete SQL file seeds the following demo data:

| Entity | Count | Notes |
| --- | --- | --- |
| Membership Plans | 4 | Premium Glow, Relax & Renew, Body Balance, Self-Care Plus |
| Members | 12 | BLM-001 through BLM-012 |
| Memberships | 12 | 8 Active, 3 Expiring Soon, 1 Expired |
| Services | 10 | Massages, facials, body treatments, etc. |
| Staff | 6 | 1 Senior Therapist, 3 Therapists, 1 Receptionist, 1 Manager — each with per_day_salary |
| Appointments | 5 | All scheduled for today |
| Payments | 10 | Mix of UPI / Card / Cash, INV-2026-001 through 010 |
| Package Offers | 5 | Festive offers, bundles, coupons |
| Campaigns | 3 | WhatsApp + Email + SMS |
| Daily Entries | 162 | Last 30 days, ~4-8 per day, mix of members & walk-ins |
| Staff Attendance | 360 | Last 60 days, 6 staff each, Sundays = Holiday |
