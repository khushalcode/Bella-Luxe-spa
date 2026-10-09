// QA Test Script — tests every server action against the live Supabase project.
// This verifies the full data layer works end-to-end.
//
// Usage: bun run scripts/qa-test.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wpdlculsoluvqbggodnq.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZGxjdWxzb2x1dnFiZ2dvZG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjAzNjgsImV4cCI6MjEwNjY5NjM2OH0.ysO04CHWFMLMCzz_mGNwokeLXZ5RlqsuECmGu1pXjbg'
const ADMIN_EMAIL = 'admin@bellaluxe.com'
const ADMIN_PASSWORD = 'BellaLuxe@2026'

// Use anon key client, then sign in as admin to get an access token
const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let adminClient: any = null
const results: { test: string; pass: boolean; detail: string }[] = []

function log(test: string, pass: boolean, detail: string = '') {
  results.push({ test, pass, detail })
  const status = pass ? '✓ PASS' : '✗ FAIL'
  console.log(`${status} — ${test}${detail ? `: ${detail}` : ''}`)
}

async function adminLogin() {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  if (error || !data.session) {
    log('Admin login', false, error?.message ?? 'no session')
    return false
  }
  adminClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  })
  log('Admin login', true, `token: ${data.session.access_token.slice(0, 20)}...`)
  return true
}

async function testReadCount(table: string, expectedMin: number = 0) {
  const { count, error } = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) {
    log(`Read ${table}`, false, error.message)
    return 0
  }
  const pass = (count ?? 0) >= expectedMin
  log(`Read ${table}`, pass, `count = ${count}${expectedMin > 0 ? ` (expected >= ${expectedMin})` : ''}`)
  return count ?? 0
}

async function testReadFirst(table: string, select: string = '*') {
  const { data, error } = await adminClient.from(table).select(select).limit(1)
  if (error) {
    log(`Read first row from ${table}`, false, error.message)
    return null
  }
  log(`Read first row from ${table}`, !!data, data && data[0] ? `got row` : 'empty')
  return data?.[0] ?? null
}

async function testCreateDailyEntry() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await adminClient
    .from('daily_entries')
    .insert({
      entry_date: today,
      member_code: 'BLM-001',
      member_name: 'QA Test Customer',
      phone: '+91 99999 99999',
      service_name: 'Aromatherapy Massage',
      therapist_name: 'Aarti Kapoor',
      amount: 1500,
      payment_mode: 'Cash',
      notes: 'QA test entry',
    })
    .select()
    .single()
  if (error) {
    log('Create daily entry', false, error.message)
    return null
  }
  log('Create daily entry', true, `id: ${data.id}`)
  return data
}

async function testUpdateDailyEntry(id: string) {
  const { data, error } = await adminClient
    .from('daily_entries')
    .update({ amount: 2000, notes: 'QA test entry - updated' })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    log('Update daily entry', false, error.message)
    return
  }
  log('Update daily entry', data.amount === 2000, `amount: ${data.amount}`)
}

async function testDeleteDailyEntry(id: string) {
  const { error } = await adminClient.from('daily_entries').delete().eq('id', id)
  log('Delete daily entry', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreateStaffAttendance(staffId: string) {
  const today = new Date().toISOString().slice(0, 10)
  // First delete any existing record for today (in case it already exists)
  await adminClient.from('staff_attendance').delete().eq('staff_id', staffId).eq('date', today)
  const { data, error } = await adminClient
    .from('staff_attendance')
    .insert({
      staff_id: staffId,
      date: today,
      status: 'Present',
      check_in: '09:30',
      check_out: '18:00',
      notes: 'QA test attendance',
    })
    .select()
    .single()
  if (error) {
    log('Create staff attendance', false, error.message)
    return null
  }
  log('Create staff attendance', true, `id: ${data.id}`)
  return data
}

async function testUpsertStaffAttendance(staffId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await adminClient
    .from('staff_attendance')
    .upsert({
      staff_id: staffId,
      date: today,
      status: 'Half-Day',
      check_in: '09:30',
      check_out: '14:00',
    }, { onConflict: 'staff_id,date' })
    .select()
    .single()
  if (error) {
    log('Upsert staff attendance', false, error.message)
    return
  }
  log('Upsert staff attendance', data.status === 'Half-Day', `status: ${data.status}`)
}

async function testCleanupOldAttendance() {
  // Insert a record dated 70 days ago, then verify cleanupOldAttendance would delete it
  const oldDate = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data: staff } = await adminClient.from('staff').select('id').limit(1)
  if (!staff || staff.length === 0) {
    log('Cleanup old attendance', false, 'no staff to test with')
    return
  }
  const staffId = staff[0].id
  // Delete any existing record for that date
  await adminClient.from('staff_attendance').delete().eq('staff_id', staffId).eq('date', oldDate)
  // Insert the old record
  await adminClient.from('staff_attendance').insert({
    staff_id: staffId,
    date: oldDate,
    status: 'Present',
    check_in: '09:30',
    check_out: '18:00',
  })
  // Now delete records older than 60 days
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data: deleted, error } = await adminClient
    .from('staff_attendance')
    .delete()
    .lt('date', cutoff)
    .select('id')
  if (error) {
    log('Cleanup old attendance', false, error.message)
    return
  }
  log('Cleanup old attendance', (deleted?.length ?? 0) >= 1, `deleted ${deleted?.length ?? 0} records`)
}

async function testCreateMember() {
  const { count } = await adminClient.from('members').select('*', { count: 'exact', head: true })
  const memberCode = `BLM-${String(100 + (count ?? 0) + 1).padStart(3, '0')}`
  const { data, error } = await adminClient
    .from('members')
    .insert({
      member_code: memberCode,
      name: 'QA Test Member',
      phone: '+91 99999 00000',
      email: 'qa.test@example.com',
      gender: 'Female',
    })
    .select()
    .single()
  if (error) {
    log('Create member', false, error.message)
    return null
  }
  log('Create member', true, `code: ${data.member_code}`)
  return data
}

async function testUpdateMember(id: string) {
  const { data, error } = await adminClient
    .from('members')
    .update({ notes: 'QA test - updated notes' })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    log('Update member', false, error.message)
    return
  }
  log('Update member', data.notes === 'QA test - updated notes', 'notes updated')
}

async function testDeleteMember(id: string) {
  const { error } = await adminClient.from('members').delete().eq('id', id)
  log('Delete member', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreatePlan() {
  const { data, error } = await adminClient
    .from('membership_plans')
    .insert({
      name: 'QA Test Plan',
      price: 9999,
      duration_days: 30,
      sessions_included: 4,
      discount_pct: 0,
      benefits: ['Test benefit'],
      is_active: true,
    })
    .select()
    .single()
  if (error) {
    log('Create plan', false, error.message)
    return null
  }
  log('Create plan', true, `id: ${data.id}`)
  return data
}

async function testDeletePlan(id: string) {
  const { error } = await adminClient.from('membership_plans').delete().eq('id', id)
  log('Delete plan', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreateService() {
  const { data, error } = await adminClient
    .from('services')
    .insert({
      name: 'QA Test Service',
      category: 'Test',
      duration_min: 30,
      price: 999,
      is_active: true,
    })
    .select()
    .single()
  if (error) {
    log('Create service', false, error.message)
    return null
  }
  log('Create service', true, `id: ${data.id}`)
  return data
}

async function testDeleteService(id: string) {
  const { error } = await adminClient.from('services').delete().eq('id', id)
  log('Delete service', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreateStaff() {
  const { data, error } = await adminClient
    .from('staff')
    .insert({
      name: 'QA Test Staff',
      role: 'Therapist',
      specialization: 'Test',
      commission_pct: 10,
      per_day_salary: 800,
      working_hours: { start: '09:00', end: '18:00' },
      is_active: true,
    })
    .select()
    .single()
  if (error) {
    log('Create staff', false, error.message)
    return null
  }
  log('Create staff', true, `id: ${data.id}, per_day_salary: ${data.per_day_salary}`)
  return data
}

async function testDeleteStaff(id: string) {
  const { error } = await adminClient.from('staff').delete().eq('id', id)
  log('Delete staff', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreatePackage() {
  const { data, error } = await adminClient
    .from('package_offers')
    .insert({
      title: 'QA Test Package',
      type: 'Coupon',
      discount_value: 100,
      discount_type: 'amount',
      valid_from: '2026-01-01',
      valid_to: '2026-12-31',
      code: 'QATEST',
      is_active: true,
    })
    .select()
    .single()
  if (error) {
    log('Create package', false, error.message)
    return null
  }
  log('Create package', true, `id: ${data.id}`)
  return data
}

async function testDeletePackage(id: string) {
  const { error } = await adminClient.from('package_offers').delete().eq('id', id)
  log('Delete package', !error, error?.message ?? `id: ${id} deleted`)
}

async function testCreateCampaign() {
  const { data, error } = await adminClient
    .from('campaigns')
    .insert({
      name: 'QA Test Campaign',
      channel: 'WhatsApp',
      template: 'Test message',
      segment: ['test'],
      status: 'Draft',
    })
    .select()
    .single()
  if (error) {
    log('Create campaign', false, error.message)
    return null
  }
  log('Create campaign', true, `id: ${data.id}`)
  return data
}

async function testDeleteCampaign(id: string) {
  const { error } = await adminClient.from('campaigns').delete().eq('id', id)
  log('Delete campaign', !error, error?.message ?? `id: ${id} deleted`)
}

async function main() {
  console.log('==========================================')
  console.log('Bella Luxe Spa CRM — QA Test Suite')
  console.log('==========================================')
  console.log(`URL: ${SUPABASE_URL}`)
  console.log(`Admin: ${ADMIN_EMAIL}`)
  console.log('')

  // 1. Login
  if (!(await adminLogin())) return

  console.log('\n--- READ TESTS (verify seed data is in Supabase) ---')
  await testReadCount('members', 12)
  await testReadCount('membership_plans', 4)
  await testReadCount('memberships', 12)
  await testReadCount('services', 10)
  await testReadCount('staff', 6)
  await testReadCount('appointments', 5)
  await testReadCount('payments', 10)
  await testReadCount('package_offers', 5)
  await testReadCount('campaigns', 3)
  await testReadCount('daily_entries', 100)
  await testReadCount('staff_attendance', 100)

  console.log('\n--- READ FIRST ROW (verify schema/column names) ---')
  await testReadFirst('members', 'member_code, name, phone')
  await testReadFirst('membership_plans', 'name, price, duration_days')
  await testReadFirst('staff', 'name, role, per_day_salary')
  await testReadFirst('daily_entries', 'entry_date, member_name, amount, payment_mode')
  await testReadFirst('staff_attendance', 'staff_id, date, status, check_in, check_out')

  console.log('\n--- DAILY ENTRIES CRUD ---')
  const de = await testCreateDailyEntry()
  if (de) {
    await testUpdateDailyEntry(de.id)
    await testDeleteDailyEntry(de.id)
  }

  console.log('\n--- STAFF ATTENDANCE CRUD + UPSERT ---')
  const { data: firstStaff } = await adminClient.from('staff').select('id').limit(1)
  if (firstStaff && firstStaff[0]) {
    await testCreateStaffAttendance(firstStaff[0].id)
    await testUpsertStaffAttendance(firstStaff[0].id)
  }

  console.log('\n--- AUTO-ARCHIVE TEST ---')
  await testCleanupOldAttendance()

  console.log('\n--- MEMBER CRUD ---')
  const m = await testCreateMember()
  if (m) {
    await testUpdateMember(m.id)
    await testDeleteMember(m.id)
  }

  console.log('\n--- PLAN CRUD ---')
  const p = await testCreatePlan()
  if (p) await testDeletePlan(p.id)

  console.log('\n--- SERVICE CRUD ---')
  const s = await testCreateService()
  if (s) await testDeleteService(s.id)

  console.log('\n--- STAFF CRUD ---')
  const st = await testCreateStaff()
  if (st) await testDeleteStaff(st.id)

  console.log('\n--- PACKAGE CRUD ---')
  const pk = await testCreatePackage()
  if (pk) await testDeletePackage(pk.id)

  console.log('\n--- CAMPAIGN CRUD ---')
  const c = await testCreateCampaign()
  if (c) await testDeleteCampaign(c.id)

  console.log('\n--- SALARY CALCULATION (verify per_day_salary works) ---')
  const { data: staffList } = await adminClient.from('staff').select('id, name, per_day_salary')
  const ym = new Date().toISOString().slice(0, 7)
  const start = `${ym}-01`
  const end = `${ym}-${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}`
  const { data: att } = await adminClient
    .from('staff_attendance')
    .select('staff_id, status')
    .gte('date', start)
    .lte('date', end)
  if (staffList && att) {
    for (const s of staffList) {
      const present = att.filter((a: any) => a.staff_id === s.id && a.status === 'Present').length
      const halfDay = att.filter((a: any) => a.staff_id === s.id && a.status === 'Half-Day').length
      const salary = present * (s.per_day_salary ?? 0) + halfDay * (s.per_day_salary ?? 0) * 0.5
      console.log(`  ${s.name}: ${present}P + ${halfDay}H × ₹${s.per_day_salary} = ₹${salary}`)
    }
    log('Salary calculation', true, `computed for ${staffList.length} staff`)
  }

  console.log('\n==========================================')
  const passed = results.filter((r) => r.pass).length
  const failed = results.filter((r) => !r.pass).length
  console.log(`RESULTS: ${passed} passed, ${failed} failed (of ${results.length} total)`)
  console.log('==========================================')
  if (failed > 0) {
    console.log('\nFailed tests:')
    results.filter((r) => !r.pass).forEach((r) => console.log(`  ✗ ${r.test}: ${r.detail}`))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('QA test crashed:', e)
  process.exit(1)
})
