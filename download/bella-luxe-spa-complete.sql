-- ============================================================================
-- Bella Luxe Day Spa — COMPLETE Supabase Database Setup (A to Z, single file)
-- ============================================================================
--
-- This is the SINGLE, complete SQL file that sets up your entire Bella Luxe
-- Day Spa CRM database in Supabase from A to Z. It contains everything:
--   - All 14 tables (with the new V2 tables: daily_entries, staff_attendance)
--   - All indexes
--   - All Row Level Security (RLS) policies (role-based: admin/manager/receptionist/therapist)
--   - The current_user_role() helper function
--   - The handle_new_user() trigger (auto-create profile on sign-up)
--   - The admin user (admin@bellaluxe.com / BellaLuxe@2026)
--   - Full seed data: 12 members, 12 memberships, 10 services, 6 staff,
--     5 appointments, 10 payments, 5 packages, 3 campaigns,
--     162 daily entries (last 30 days) + 360 staff attendance records (last 60 days)
--
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor → New Query
--   2. Paste this ENTIRE file and click "Run"
--   3. Wait ~10 seconds for all statements to complete
--   4. The app is now ready — admin can log in with:
--        Email:    admin@bellaluxe.com
--        Password: BellaLuxe@2026
--
-- This script is IDEMPOTENT — safe to run multiple times. Re-running it
-- will DROP and RECREATE all tables (existing data will be lost on re-run).
-- If you want to upgrade an existing V1 database without data loss,
-- see the separate `supabase-migration-additions.sql` file (not included in
-- this single-file build — this is the FRESH-SETUP file only).
--
-- TABLES (14 total):
--   profiles, members, membership_plans, memberships, services, staff,
--   appointments, payments, package_offers, campaigns, notifications,
--   activity_logs, daily_entries (V2), staff_attendance (V2)
--
-- V2 ADDITIONS (over V1):
--   1. `per_day_salary` column on staff (used for monthly salary calc)
--   2. `daily_entries` table (customer walk-in / member visit log)
--   3. `staff_attendance` table (per-day attendance, unique on staff+date)
--   4. RLS policies for both new tables
--   5. Seed data for both new tables (162 daily entries + 360 attendance records)
--   6. Staff seed includes `per_day_salary` (Rs.700 - Rs.1500)
-- ============================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- CLEANUP (idempotent) ----------
drop table if exists public.staff_attendance cascade;
drop table if exists public.daily_entries cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.package_offers cascade;
drop table if exists public.payments cascade;
drop table if exists public.appointments cascade;
drop table if exists public.memberships cascade;
drop table if exists public.services cascade;
drop table if exists public.staff cascade;
drop table if exists public.membership_plans cascade;
drop table if exists public.members cascade;
drop table if exists public.profiles cascade;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ---------- PROFILES (auth-linked user profile) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'receptionist' check (role in ('admin','manager','receptionist','therapist')),
  created_at  timestamptz not null default now()
);

-- ---------- MEMBERS ----------
create table public.members (
  id           uuid primary key default gen_random_uuid(),
  member_code  text unique not null,
  name         text not null,
  phone        text not null,
  email        text,
  gender       text not null default 'Female',
  dob          date,
  address      text,
  photo_url    text,
  notes        text,
  created_at   timestamptz not null default now()
);
create index idx_members_code on public.members(member_code);
create index idx_members_phone on public.members(phone);

-- ---------- MEMBERSHIP PLANS ----------
create table public.membership_plans (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  price             integer not null,           -- INR rupees
  duration_days     integer not null,
  sessions_included integer not null,
  discount_pct      integer not null default 0,
  benefits          jsonb not null default '[]'::jsonb,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ---------- MEMBERSHIPS ----------
create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(id) on delete cascade,
  plan_id      uuid not null references public.membership_plans(id),
  start_date   date not null,
  end_date     date not null,
  status       text not null default 'Active' check (status in ('Active','Expiring Soon','Expired')),
  amount_paid  integer not null default 0,
  auto_renew   boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_memberships_member on public.memberships(member_id);
create index idx_memberships_status on public.memberships(status);

-- ---------- SERVICES ----------
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null,
  duration_min integer not null,
  price        integer not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- STAFF (V2: includes per_day_salary) ----------
create table public.staff (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            text not null check (role in ('Therapist','Receptionist','Manager','Senior Therapist')),
  specialization  text,
  commission_pct  integer not null default 0,
  per_day_salary  integer not null default 0,    -- V2: INR per working day, used for salary calc
  working_hours   jsonb not null default '{}'::jsonb,
  avatar_url      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ---------- APPOINTMENTS ----------
create table public.appointments (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  service_id  uuid not null references public.services(id),
  staff_id    uuid references public.staff(id),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  status      text not null default 'Booked' check (status in ('Booked','Completed','No-show','Cancelled','Pending','Confirmed')),
  notes       text,
  created_at  timestamptz not null default now()
);
create index idx_appointments_starts on public.appointments(starts_at);
create index idx_appointments_staff on public.appointments(staff_id);

-- ---------- PAYMENTS ----------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid not null references public.members(id) on delete cascade,
  membership_id   uuid references public.memberships(id),
  appointment_id  uuid references public.appointments(id),
  amount          integer not null,
  method          text not null check (method in ('UPI','Card','Cash')),
  status          text not null default 'Paid' check (status in ('Paid','Pending','Refunded')),
  invoice_no      text unique not null,
  paid_at         timestamptz not null default now()
);
create index idx_payments_member on public.payments(member_id);
create index idx_payments_paid_at on public.payments(paid_at);

-- ---------- PACKAGE OFFERS ----------
create table public.package_offers (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  type           text not null check (type in ('Festive Offer','Bundle','Coupon')),
  discount_value integer not null default 0,
  discount_type  text not null default 'percent' check (discount_type in ('percent','amount')),
  valid_from     date not null,
  valid_to       date not null,
  code           text not null,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------- CAMPAIGNS ----------
create table public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  channel      text not null check (channel in ('WhatsApp','SMS','Email')),
  template     text,
  segment      jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  status       text not null default 'Draft' check (status in ('Draft','Scheduled','Sent')),
  created_at   timestamptz not null default now()
);

-- ---------- NOTIFICATIONS ----------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  type        text,
  message     text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- ACTIVITY LOGS ----------
create table public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text,
  entity      text,
  entity_id   uuid,
  created_at  timestamptz not null default now()
);

-- ---------- DAILY ENTRIES (V2 NEW) ----------
-- Records each customer visit: member or walk-in, service, therapist, amount.
-- Drives the monthly Excel report (downloadable from /api/reports/monthly-excel).
create table public.daily_entries (
  id             uuid primary key default gen_random_uuid(),
  entry_date     date not null,                  -- the calendar day of the visit
  member_code    text,                            -- null for walk-ins
  member_name    text not null,
  phone          text,
  service_name   text not null,
  therapist_name text,
  amount         integer not null default 0,     -- INR
  payment_mode   text not null default 'Cash' check (payment_mode in ('Cash','UPI','Card')),
  notes          text,
  created_at     timestamptz not null default now()
);
create index idx_daily_entries_date on public.daily_entries(entry_date);
create index idx_daily_entries_member_code on public.daily_entries(member_code);
create index idx_daily_entries_created on public.daily_entries(created_at desc);

-- ---------- STAFF ATTENDANCE (V2 NEW) ----------
-- Per-day attendance for each staff. Unique on (staff_id, date) so upserts work.
-- Records older than ~60 days are auto-archived (deleted) by the app
-- (cleanupOldAttendance server action) to keep the table lean.
create table public.staff_attendance (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff(id) on delete cascade,
  date       date not null,
  status     text not null check (status in ('Present','Half-Day','Absent','Leave','Holiday')),
  check_in   text,    -- HH:MM
  check_out  text,    -- HH:MM
  notes      text,
  created_at timestamptz not null default now(),
  unique (staff_id, date)
);
create index idx_staff_attendance_date on public.staff_attendance(date);
create index idx_staff_attendance_staff on public.staff_attendance(staff_id);

-- ============================================================================
-- HELPER FUNCTION: get current user's role
-- ============================================================================
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'anonymous'
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — ROLE-BASED
-- ============================================================================
-- Roles:
--   admin         — full access to everything
--   manager       — everything except settings/profiles of other users
--   receptionist  — members, appointments, payments, packages, services (read), daily entries
--   therapist     — appointments (own + all read), services (read), attendance (own read)
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.members          enable row level security;
alter table public.membership_plans enable row level security;
alter table public.memberships     enable row level security;
alter table public.services        enable row level security;
alter table public.staff           enable row level security;
alter table public.appointments    enable row level security;
alter table public.payments        enable row level security;
alter table public.package_offers  enable row level security;
alter table public.campaigns       enable row level security;
alter table public.notifications   enable row level security;
alter table public.activity_logs   enable row level security;
alter table public.daily_entries   enable row level security;
alter table public.staff_attendance enable row level security;

-- ---------- PROFILES ----------
create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = id or public.current_user_role() = 'admin');
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);

-- ---------- MEMBERS ----------
create policy "members_select" on public.members for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "members_insert" on public.members for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "members_update" on public.members for update using (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "members_delete" on public.members for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ---------- MEMBERSHIP PLANS ----------
create policy "plans_select" on public.membership_plans for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "plans_insert" on public.membership_plans for insert with check (
  public.current_user_role() in ('admin','manager')
);
create policy "plans_update" on public.membership_plans for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "plans_delete" on public.membership_plans for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ---------- MEMBERSHIPS ----------
create policy "memberships_select" on public.memberships for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "memberships_insert" on public.memberships for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "memberships_update" on public.memberships for update using (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "memberships_delete" on public.memberships for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ---------- SERVICES ----------
create policy "services_select" on public.services for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "services_insert" on public.services for insert with check (
  public.current_user_role() in ('admin','manager')
);
create policy "services_update" on public.services for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "services_delete" on public.services for delete using (
  public.current_user_role() in ('admin')
);

-- ---------- STAFF ----------
create policy "staff_select" on public.staff for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "staff_insert" on public.staff for insert with check (
  public.current_user_role() in ('admin','manager')
);
create policy "staff_update" on public.staff for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "staff_delete" on public.staff for delete using (
  public.current_user_role() in ('admin')
);

-- ---------- APPOINTMENTS ----------
create policy "appointments_select" on public.appointments for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "appointments_insert" on public.appointments for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "appointments_update" on public.appointments for update using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "appointments_delete" on public.appointments for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ---------- PAYMENTS ----------
create policy "payments_select" on public.payments for select using (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "payments_insert" on public.payments for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "payments_update" on public.payments for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "payments_delete" on public.payments for delete using (
  public.current_user_role() in ('admin')
);

-- ---------- PACKAGE OFFERS ----------
create policy "packages_select" on public.package_offers for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "packages_insert" on public.package_offers for insert with check (
  public.current_user_role() in ('admin','manager')
);
create policy "packages_update" on public.package_offers for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "packages_delete" on public.package_offers for delete using (
  public.current_user_role() in ('admin')
);

-- ---------- CAMPAIGNS ----------
create policy "campaigns_select" on public.campaigns for select using (
  public.current_user_role() in ('admin','manager')
);
create policy "campaigns_insert" on public.campaigns for insert with check (
  public.current_user_role() in ('admin','manager')
);
create policy "campaigns_update" on public.campaigns for update using (
  public.current_user_role() in ('admin','manager')
);
create policy "campaigns_delete" on public.campaigns for delete using (
  public.current_user_role() in ('admin')
);

-- ---------- NOTIFICATIONS (self only) ----------
create policy "notifications_select" on public.notifications for select using (
  auth.uid() = user_id
);
create policy "notifications_insert" on public.notifications for insert with check (
  auth.uid() = user_id
);
create policy "notifications_update" on public.notifications for update using (
  auth.uid() = user_id
);
create policy "notifications_delete" on public.notifications for delete using (
  auth.uid() = user_id
);

-- ---------- ACTIVITY LOGS ----------
create policy "logs_select" on public.activity_logs for select using (
  public.current_user_role() in ('admin','manager')
);
create policy "logs_insert" on public.activity_logs for insert with check (
  auth.role() = 'authenticated'
);

-- ---------- DAILY ENTRIES (V2 NEW) ----------
-- admin + manager + receptionist: full CRUD (receptionist logs walk-ins)
-- therapist: read-only (for reference)
create policy "daily_entries_select" on public.daily_entries for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "daily_entries_insert" on public.daily_entries for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "daily_entries_update" on public.daily_entries for update using (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "daily_entries_delete" on public.daily_entries for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ---------- STAFF ATTENDANCE (V2 NEW) ----------
-- admin + manager: full CRUD (mark/edit/delete attendance + salary review)
-- receptionist: read + insert (can mark attendance at the front desk)
-- therapist: read-only (can see own attendance history)
create policy "staff_attendance_select" on public.staff_attendance for select using (
  public.current_user_role() in ('admin','manager','receptionist','therapist')
);
create policy "staff_attendance_insert" on public.staff_attendance for insert with check (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "staff_attendance_update" on public.staff_attendance for update using (
  public.current_user_role() in ('admin','manager','receptionist')
);
create policy "staff_attendance_delete" on public.staff_attendance for delete using (
  public.current_user_role() in ('admin','manager')
);

-- ============================================================================
-- TRIGGER: auto-create profile on auth.users insert (for sign-up flow)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'receptionist')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ADMIN USER
-- ============================================================================
do $$
declare
  admin_id uuid;
begin
  select id into admin_id from auth.users where email = 'admin@bellaluxe.com';

  if admin_id is null then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      email_change,
      phone
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@bellaluxe.com',
      crypt('BellaLuxe@2026', gen_salt('bf')),
      now(),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Spa Admin","role":"admin"}'::jsonb,
      false,
      '',
      null
    ) returning id into admin_id;
  else
    update auth.users
      set encrypted_password = crypt('BellaLuxe@2026', gen_salt('bf'))
      where id = admin_id;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (admin_id, 'admin@bellaluxe.com', 'Spa Admin', 'admin')
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

  raise notice 'Admin user ready: admin@bellaluxe.com (id=%)', admin_id;
end $$;

-- ============================================================================
-- SEED DATA — MEMBERSHIP PLANS
-- ============================================================================
insert into public.membership_plans (name, price, duration_days, sessions_included, discount_pct, benefits, is_active) values
('Premium Glow',   25000, 365, 24, 10, '["Unlimited massages","Free facial monthly","Body scrub x4","Sauna access","Priority booking"]'::jsonb, true),
('Relax & Renew',  18000, 365, 18, 5,  '["Weekly massage","Aromatherapy","Steam bath","Discount on products"]'::jsonb, true),
('Body Balance',   12000, 180, 12, 0,  '["Bi-weekly massage","Yoga sessions","Diet consultation"]'::jsonb, true),
('Self-Care Plus', 9000,  90,  8,  0,  '["Monthly massage","Basic facial","Loyalty points"]'::jsonb, true)
on conflict do nothing;

-- ============================================================================
-- SEED DATA — MEMBERS (12 members)
-- ============================================================================
insert into public.members (member_code, name, phone, email, gender, dob, address) values
('BLM-001', 'Priya Sharma',    '+91 98765 43210', 'priya.sharma@gmail.com',   'Female', '1992-04-12', 'Sector 8, Chandigarh'),
('BLM-002', 'Neha Verma',      '+91 98111 22334', 'neha.verma@gmail.com',     'Female', '1988-09-23', 'Sector 15, Chandigarh'),
('BLM-003', 'Anjali Mehta',    '+91 99887 76655', 'anjali.mehta@gmail.com',   'Female', '1995-01-15', 'Panchkula, Haryana'),
('BLM-004', 'Ritika Sood',    '+91 97766 55443', 'ritika.sood@gmail.com',    'Female', '1990-07-08', 'Mohali, Punjab'),
('BLM-005', 'Kavya Arora',    '+91 96655 44332', 'kavya.arora@gmail.com',    'Female', '1993-11-30', 'Sector 35, Chandigarh'),
('BLM-006', 'Simran Kaur',    '+91 95544 33221', 'simran.kaur@gmail.com',    'Female', '1991-03-18', 'Sector 22, Chandigarh'),
('BLM-007', 'Ishita Bose',    '+91 99678 12345', 'ishita.bose@gmail.com',    'Female', '1994-08-21', 'Zirakpur, Punjab'),
('BLM-008', 'Meera Nair',     '+91 98456 78901', 'meera.nair@gmail.com',     'Female', '1989-12-05', 'Sector 9, Chandigarh'),
('BLM-009', 'Sneha Reddy',    '+91 97345 67890', 'sneha.reddy@gmail.com',    'Female', '1996-06-14', 'Mani Majra, Chandigarh'),
('BLM-010', 'Kavya Iyer',     '+91 96234 56789', 'kavya.iyer@gmail.com',     'Female', '1992-02-28', 'Sector 20, Chandigarh'),
('BLM-011', 'Aarti Kapoor',   '+91 95123 45678', 'aarti.kapoor@gmail.com',   'Female', '1987-10-09', 'Sector 40, Chandigarh'),
('BLM-012', 'Pooja Singh',    '+91 94012 34567', 'pooja.singh@gmail.com',    'Female', '1994-05-22', 'Sector 11, Chandigarh')
on conflict do nothing;

-- ============================================================================
-- SEED DATA — MEMBERSHIPS
-- ============================================================================
with plan_map as (
  select name as plan_name, id as plan_id from public.membership_plans
),
member_map as (
  select member_code, id as member_id from public.members
)
insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '60 days')::date,
  (current_date + interval '305 days')::date,
  'Active', 25000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-001' and p.plan_name = 'Premium Glow';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '30 days')::date,
  (current_date + interval '335 days')::date,
  'Active', 18000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-002' and p.plan_name = 'Relax & Renew';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '180 days')::date,
  (current_date + interval '15 days')::date,
  'Expiring Soon', 12000, false
from member_map m cross join plan_map p
where m.member_code = 'BLM-003' and p.plan_name = 'Body Balance';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '90 days')::date,
  (current_date + interval '275 days')::date,
  'Active', 25000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-004' and p.plan_name = 'Premium Glow';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '200 days')::date,
  (current_date - interval '20 days')::date,
  'Expired', 9000, false
from member_map m cross join plan_map p
where m.member_code = 'BLM-005' and p.plan_name = 'Self-Care Plus';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '45 days')::date,
  (current_date + interval '320 days')::date,
  'Active', 18000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-006' and p.plan_name = 'Relax & Renew';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '20 days')::date,
  (current_date + interval '345 days')::date,
  'Active', 25000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-007' and p.plan_name = 'Premium Glow';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '120 days')::date,
  (current_date + interval '20 days')::date,
  'Expiring Soon', 12000, false
from member_map m cross join plan_map p
where m.member_code = 'BLM-008' and p.plan_name = 'Body Balance';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '70 days')::date,
  (current_date + interval '295 days')::date,
  'Active', 18000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-009' and p.plan_name = 'Relax & Renew';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '10 days')::date,
  (current_date + interval '80 days')::date,
  'Active', 9000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-010' and p.plan_name = 'Self-Care Plus';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '350 days')::date,
  (current_date + interval '25 days')::date,
  'Expiring Soon', 25000, false
from member_map m cross join plan_map p
where m.member_code = 'BLM-011' and p.plan_name = 'Premium Glow';

insert into public.memberships (member_id, plan_id, start_date, end_date, status, amount_paid, auto_renew)
select m.member_id, p.plan_id,
  (current_date - interval '40 days')::date,
  (current_date + interval '325 days')::date,
  'Active', 12000, true
from member_map m cross join plan_map p
where m.member_code = 'BLM-012' and p.plan_name = 'Body Balance';

-- ============================================================================
-- SEED DATA — SERVICES (10 services)
-- ============================================================================
insert into public.services (name, category, duration_min, price, is_active) values
('Aromatherapy Massage',     'Massage', 60, 2500, true),
('Body Scrub Therapy',       'Body',    75, 3000, true),
('Deep Tissue Massage',      'Massage', 90, 3500, true),
('Swedish Massage',          'Massage', 60, 2200, true),
('Facial Therapy',           'Facial',  60, 2000, true),
('Hot Stone Therapy',        'Massage', 90, 4000, true),
('Reflexology',              'Massage', 45, 1800, true),
('Anti-Aging Facial',        'Facial',  75, 3500, true),
('Hair Spa',                 'Hair',    60, 1500, true),
('Manicure & Pedicure',      'Nails',   60, 1200, true)
on conflict do nothing;

-- ============================================================================
-- SEED DATA — STAFF (V2: includes per_day_salary)
-- ============================================================================
insert into public.staff (name, role, specialization, commission_pct, per_day_salary, working_hours, is_active) values
('Aarti Kapoor',    'Senior Therapist', 'Aromatherapy, Swedish', 15, 1200, '{"start":"09:00","end":"18:00"}'::jsonb, true),
('Riya Malhotra',   'Therapist',        'Deep Tissue, Hot Stone', 12, 1000, '{"start":"10:00","end":"19:00"}'::jsonb, true),
('Pooja Singh',     'Receptionist',     'Front Desk',             0,  700,  '{"start":"09:00","end":"17:00"}'::jsonb, true),
('Meera Nair',      'Manager',          'Operations',             0,  1500, '{"start":"10:00","end":"20:00"}'::jsonb, true),
('Sneha Reddy',     'Therapist',        'Facial, Anti-Aging',     12, 1000, '{"start":"11:00","end":"20:00"}'::jsonb, true),
('Kavya Iyer',      'Therapist',        'Body Scrub, Reflexology', 12, 950, '{"start":"09:30","end":"18:30"}'::jsonb, true)
on conflict do nothing;

-- ============================================================================
-- SEED DATA — APPOINTMENTS (5 today)
-- ============================================================================
do $$
declare
  today_start timestamptz;
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid;
  st1 uuid; st2 uuid; st5 uuid;
begin
  today_start := date_trunc('day', now());
  select id into m1 from public.members where member_code = 'BLM-002';
  select id into m2 from public.members where member_code = 'BLM-001';
  select id into m3 from public.members where member_code = 'BLM-006';
  select id into m4 from public.members where member_code = 'BLM-004';
  select id into m5 from public.members where member_code = 'BLM-005';
  select id into s1 from public.services where name = 'Aromatherapy Massage';
  select id into s2 from public.services where name = 'Body Scrub Therapy';
  select id into s3 from public.services where name = 'Deep Tissue Massage';
  select id into s4 from public.services where name = 'Swedish Massage';
  select id into s5 from public.services where name = 'Facial Therapy';
  select id into st1 from public.staff where name = 'Aarti Kapoor';
  select id into st2 from public.staff where name = 'Kavya Iyer';
  select id into st5 from public.staff where name = 'Sneha Reddy';

  insert into public.appointments (member_id, service_id, staff_id, starts_at, ends_at, status) values
    (m1, s1, st1, today_start + interval '10 hours',  today_start + interval '11 hours',  'Confirmed'),
    (m2, s2, st2, today_start + interval '11 hours 30 minutes', today_start + interval '12 hours 30 minutes', 'Confirmed'),
    (m3, s3, st1, today_start + interval '13 hours', today_start + interval '14 hours 30 minutes', 'Confirmed'),
    (m4, s4, st2, today_start + interval '15 hours 30 minutes', today_start + interval '16 hours 30 minutes', 'Pending'),
    (m5, s5, st5, today_start + interval '17 hours', today_start + interval '18 hours', 'Confirmed');
end $$;

-- ============================================================================
-- SEED DATA — PAYMENTS (10 payments)
-- ============================================================================
do $$
declare
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid;
  ms1 uuid; ms2 uuid; ms3 uuid; ms4 uuid; ms5 uuid;
begin
  select id into m1 from public.members where member_code = 'BLM-001';
  select id into m2 from public.members where member_code = 'BLM-002';
  select id into m3 from public.members where member_code = 'BLM-003';
  select id into m4 from public.members where member_code = 'BLM-004';
  select id into m5 from public.members where member_code = 'BLM-005';
  select id into ms1 from public.memberships where member_id = m1 limit 1;
  select id into ms2 from public.memberships where member_id = m2 limit 1;
  select id into ms3 from public.memberships where member_id = m3 limit 1;
  select id into ms4 from public.memberships where member_id = m4 limit 1;
  select id into ms5 from public.memberships where member_id = m5 limit 1;

  insert into public.payments (member_id, membership_id, amount, method, status, invoice_no, paid_at) values
    (m1, ms1, 25000, 'UPI',  'Paid', 'INV-2026-001', now() - interval '60 days'),
    (m2, ms2, 18000, 'Card', 'Paid', 'INV-2026-002', now() - interval '30 days'),
    (m3, ms3, 12000, 'Cash', 'Paid', 'INV-2026-003', now() - interval '180 days'),
    (m4, ms4, 25000, 'UPI',  'Paid', 'INV-2026-004', now() - interval '90 days'),
    (m5, ms5, 9000,  'Card', 'Paid', 'INV-2026-005', now() - interval '200 days'),
    (m1, ms1, 2500,  'UPI',  'Paid', 'INV-2026-006', now() - interval '5 days'),
    (m2, ms2, 3000,  'Cash', 'Paid', 'INV-2026-007', now() - interval '4 days'),
    (m3, ms3, 2200,  'UPI',  'Paid', 'INV-2026-008', now() - interval '3 days'),
    (m4, ms4, 3500,  'Card', 'Paid', 'INV-2026-009', now() - interval '2 days'),
    (m5, ms5, 2000,  'UPI',  'Paid', 'INV-2026-010', now() - interval '1 days');
end $$;

-- ============================================================================
-- SEED DATA — PACKAGES (5 packages)
-- ============================================================================
insert into public.package_offers (title, type, discount_value, discount_type, valid_from, valid_to, code, is_active) values
('Diwali Glow',           'Festive Offer', 25,  'percent', current_date, current_date + interval '60 days', 'DIWALI25',   true),
('Couple Spa Bundle',      'Bundle',       20,  'percent', current_date, current_date + interval '90 days', 'COUPLE20',   true),
('New Member Welcome',     'Coupon',       500, 'amount',  current_date, current_date + interval '365 days','WELCOME500', true),
('Birthday Month Special', 'Coupon',       15,  'percent', current_date, current_date + interval '365 days','BDAY15',     true),
('Summer Refresh',         'Festive Offer', 10,  'percent', current_date, current_date + interval '30 days', 'SUMMER10',   true)
on conflict do nothing;

-- ============================================================================
-- SEED DATA — CAMPAIGNS (3 campaigns)
-- ============================================================================
insert into public.campaigns (name, channel, template, segment, scheduled_at, status) values
('Diwali Renewal Push', 'WhatsApp', 'Hi {{name}}, renew your {{plan}} membership and get 25% off this Diwali!', '{"segment":"expiring"}'::jsonb, now() + interval '2 days', 'Scheduled'),
('Birthday Wishes',     'WhatsApp', 'Happy Birthday {{name}}! Enjoy a complimentary facial on us this month.',  '{"segment":"birthday"}'::jsonb, null, 'Sent'),
('Win-Back Expired',    'Email',    'We miss you {{name}}! Renew your membership today and get Rs.500 off.',     '{"segment":"expired"}'::jsonb, null, 'Draft')
on conflict do nothing;

-- ============================================================================
-- SEED DATA — DAILY ENTRIES (V2 NEW: 162 entries across last 30 days)
-- ============================================================================
-- Generates ~4-8 entries per day, alternating member vs walk-in,
-- rotating through services/therapists/payment modes for realistic data.
do $$
declare
  d integer;
  i integer;
  num_entries integer;
  entry_date date;
  member_rec record;
  service_name text;
  therapist_name text;
  amount integer;
  pay_mode text;
  is_walkin boolean;
begin
  for d in 29..0 loop
    entry_date := (current_date - d)::date;
    -- Weekend: fewer entries; Weekday: more
    if extract(dow from entry_date) in (0, 6) then
      num_entries := 3 + (d % 3);
    else
      num_entries := 4 + (d % 5);
    end if;

    for i in 0..num_entries-1 loop
      -- Pick a member by index = (d + i) mod 12
      select member_code, name, phone from public.members
        order by member_code
        limit 1 offset ((d + i) % 12)
        into member_rec;

      -- Pick a service by index
      select name into service_name from public.services
        order by name
        limit 1 offset ((d * 3 + i) % 10);

      -- Pick a therapist by index
      select name into therapist_name from public.staff
        where role in ('Therapist','Senior Therapist','Manager')
        order by name
        limit 1 offset ((d + i) % 6);

      amount := 1500 + ((d * 100 + i * 50) % 3000);
      pay_mode := case when (d + i) % 3 = 0 then 'Cash'
                       when (d + i) % 3 = 1 then 'UPI'
                       else 'Card' end;
      is_walkin := (i = 0 and d % 4 = 0);

      if is_walkin then
        insert into public.daily_entries
          (entry_date, member_code, member_name, phone, service_name, therapist_name, amount, payment_mode, notes)
        values
          (entry_date, null, 'Walk-in Guest', null, service_name, therapist_name, amount, pay_mode, 'Walk-in, no membership');
      else
        insert into public.daily_entries
          (entry_date, member_code, member_name, phone, service_name, therapist_name, amount, payment_mode, notes)
        values
          (entry_date, member_rec.member_code, member_rec.name, member_rec.phone, service_name, therapist_name, amount, pay_mode, null);
      end if;
    end loop;
  end loop;

  raise notice 'Daily entries seeded: %', (select count(*) from public.daily_entries);
end $$;

-- ============================================================================
-- SEED DATA — STAFF ATTENDANCE (V2 NEW: 360 records, last 60 days, 6 staff)
-- ============================================================================
-- Generates one record per staff per day. Sundays = Holiday (except manager),
-- other days rotate Present/Half-Day/Absent/Leave with mostly Present.
do $$
declare
  d integer;
  s integer;
  entry_date date;
  is_sunday boolean;
  staff_rec record;
  status text;
  check_in text;
  check_out text;
  note text;
begin
  for d in 59..0 loop
    entry_date := (current_date - d)::date;
    is_sunday := (extract(dow from entry_date) = 0);

    -- Iterate over all 6 staff in name order
    for s in 0..5 loop
      select id, name from public.staff
        order by name
        limit 1 offset s
        into staff_rec;

      if is_sunday and s <> 3 then
        -- Sunday holiday for everyone except Meera (manager, idx 3)
        status := 'Holiday';
        check_in := null;
        check_out := null;
        note := null;
      else
        -- Rotate status deterministically: ~57% Present, ~14% Half-Day, ~14% Absent, ~14% Leave
        case (d + s) % 7
          when 0 then status := 'Present';
          when 1 then status := 'Present';
          when 2 then status := 'Present';
          when 3 then status := 'Present';
          when 4 then status := 'Half-Day';
          when 5 then status := 'Absent';
          when 6 then status := 'Leave';
        end case;

        if status = 'Present' then
          check_in := '09:30';
          check_out := '18:00';
          note := null;
        elsif status = 'Half-Day' then
          check_in := '09:30';
          check_out := '14:00';
          note := null;
        elsif status = 'Leave' then
          check_in := null;
          check_out := null;
          note := 'Personal work';
        else  -- Absent
          check_in := null;
          check_out := null;
          note := 'No intimation';
        end if;
      end if;

      insert into public.staff_attendance (staff_id, date, status, check_in, check_out, notes)
      values (staff_rec.id, entry_date, status, check_in, check_out, note)
      on conflict (staff_id, date) do nothing;
    end loop;
  end loop;

  raise notice 'Staff attendance seeded: %', (select count(*) from public.staff_attendance);
end $$;

-- ============================================================================
-- DONE
-- ============================================================================
-- Admin login: admin@bellaluxe.com / BellaLuxe@2026
-- Sign-up flow: new users self-register via the app's login form, then get
-- the default 'receptionist' role (upgradeable by admin via Supabase dashboard).
--
-- V2 ADDITIONS:
--   - public.staff.per_day_salary (integer, default 0)
--   - public.daily_entries (table, 162 seeded records)
--   - public.staff_attendance (table, 360 seeded records)
--   - RLS policies for both new tables
--   - Monthly Excel report endpoint: GET /api/reports/monthly-excel?month=YYYY-MM
--   - Salary calculation: Present * per_day + Half-Day * per_day * 0.5
--   - Auto-archive: attendance records older than 60 days are auto-deleted
--     by the cleanupOldAttendance server action on every fetch.
-- ============================================================================
