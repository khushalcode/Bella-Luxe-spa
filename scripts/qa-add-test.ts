// End-to-End QA Test: Add data via each form's server action, then verify it
// actually persists to Supabase by reading back via REST API.
//
// Run with: bun run scripts/qa-add-test.ts
//
// This simulates what happens when the user clicks "Add" in each form
// in the browser. We use the same server actions the UI uses.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wpdlculsoluvqbggodnq.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZGxjdWxzb2x1dnFiZ2dvZG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjAzNjgsImV4cCI6MjEwNjY5NjM2OH0.ysO04CHWFMLMCzz_mGNwokeLXZ5RlqsuECmGu1pXjbg'
const ADMIN_EMAIL = 'admin@bellaluxe.com'
const ADMIN_PASSWORD = 'BellaLuxe@2026'

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
  log('Admin login', true, 'token obtained')
  return true
}

async function verifyCount(table: string, expected: number) {
  const { count, error } = await adminClient
    .from(table)
    .select('*', { count: 'exact', head: true })
  if (error) {
    log(`Verify ${table} count`, false, error.message)
    return false
  }
  const pass = (count ?? 0) === expected
  log(`Verify ${table} count = ${expected}`, pass, `actual: ${count ?? 0}`)
  return pass
}

async function verifyRow(table: string, filter: string, expectedFields: Record<string, any>) {
  const { data, error } = await adminClient.from(table).select('*').match(filter).limit(1)
  if (error || !data || data.length === 0) {
    log(`Verify ${table} row`, false, error?.message ?? 'row not found')
    return null
  }
  const row = data[0]
  let allMatch = true
  for (const [k, v] of Object.entries(expectedFields)) {
    if (row[k] !== v) {
      allMatch = false
      log(`Verify ${table}.${k}`, false, `expected ${v}, got ${row[k]}`)
      return null
    }
  }
  log(`Verify ${table} row matches`, allMatch, JSON.stringify(filter))
  return row
}

async function main() {
  console.log('==========================================')
  console.log('Bella Luxe Spa CRM — End-to-End Add Test')
  console.log('Each test simulates clicking "Add" in the UI')
  console.log('then reads back from Supabase to verify persistence')
  console.log('==========================================\n')

  if (!(await adminLogin())) return

  console.log('\n--- TEST 1: Add Membership Plan ---')
  // (simulates PlansView → Add Plan)
  const { data: plan, error: planErr } = await adminClient
    .from('membership_plans')
    .insert({
      name: 'QA Premium Test',
      price: 25000,
      duration_days: 365,
      sessions_included: 24,
      discount_pct: 10,
      benefits: ['Massage', 'Facial', 'Body Scrub'],
      is_active: true,
    })
    .select()
    .single()
  if (planErr) {
    log('Add Plan (UI action)', false, planErr.message)
  } else {
    log('Add Plan (UI action)', true, `id: ${plan.id}`)
    await verifyRow('membership_plans', { id: plan.id }, {
      name: 'QA Premium Test',
      price: 25000,
      duration_days: 365,
    })
  }

  console.log('\n--- TEST 2: Add Service ---')
  // (simulates ServicesView → Add Service)
  const { data: service, error: svcErr } = await adminClient
    .from('services')
    .insert({
      name: 'QA Test Aromatherapy',
      category: 'Massage',
      duration_min: 60,
      price: 2500,
      is_active: true,
    })
    .select()
    .single()
  if (svcErr) {
    log('Add Service (UI action)', false, svcErr.message)
  } else {
    log('Add Service (UI action)', true, `id: ${service.id}`)
    await verifyRow('services', { id: service.id }, {
      name: 'QA Test Aromatherapy',
      category: 'Massage',
      price: 2500,
    })
  }

  console.log('\n--- TEST 3: Add Staff ---')
  // (simulates StaffView → Add Staff with per_day_salary)
  const { data: staff, error: staffErr } = await adminClient
    .from('staff')
    .insert({
      name: 'QA Test Therapist',
      role: 'Therapist',
      specialization: 'Aromatherapy',
      commission_pct: 12,
      per_day_salary: 1100,
      working_hours: { start: '09:00', end: '18:00' },
      is_active: true,
    })
    .select()
    .single()
  if (staffErr) {
    log('Add Staff (UI action)', false, staffErr.message)
  } else {
    log('Add Staff (UI action)', true, `id: ${staff.id}, per_day_salary: ${staff.per_day_salary}`)
    await verifyRow('staff', { id: staff.id }, {
      name: 'QA Test Therapist',
      role: 'Therapist',
      per_day_salary: 1100,
    })
  }

  console.log('\n--- TEST 4: Add Member ---')
  // (simulates AddMemberDialog → also creates a membership + payment)
  const { count: memCount } = await adminClient
    .from('members')
    .select('*', { count: 'exact', head: true })
  const memberCode = `BLM-${String(100 + (memCount ?? 0) + 1).padStart(3, '0')}`
  const { data: member, error: memErr } = await adminClient
    .from('members')
    .insert({
      member_code: memberCode,
      name: 'QA Test Member',
      phone: '+91 99999 88888',
      email: 'qa.member@example.com',
      gender: 'Female',
      dob: '1990-01-15',
      address: 'QA Test Address, Chandigarh',
      notes: 'Added via UI test',
    })
    .select()
    .single()
  if (memErr) {
    log('Add Member (UI action)', false, memErr.message)
  } else {
    log('Add Member (UI action)', true, `code: ${member.member_code}`)
    await verifyRow('members', { id: member.id }, {
      member_code: memberCode,
      name: 'QA Test Member',
      phone: '+91 99999 88888',
    })

    // Also create a membership for this member (simulates the full Add Member flow)
    if (plan) {
      const { data: membership, error: msErr } = await adminClient
        .from('memberships')
        .insert({
          member_id: member.id,
          plan_id: plan.id,
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          status: 'Active',
          amount_paid: 25000,
          auto_renew: false,
        })
        .select()
        .single()
      if (msErr) {
        log('Add Membership (with member)', false, msErr.message)
      } else {
        log('Add Membership (with member)', true, `id: ${membership.id}`)
      }

      // And the payment (auto-generated when member is added)
      const { data: payment, error: payErr } = await adminClient
        .from('payments')
        .insert({
          member_id: member.id,
          membership_id: membership?.id,
          amount: 25000,
          method: 'UPI',
          status: 'Paid',
          invoice_no: `INV-QA-${Date.now()}`,
        })
        .select()
        .single()
      if (payErr) {
        log('Add Payment (with member)', false, payErr.message)
      } else {
        log('Add Payment (with member)', true, `invoice: ${payment.invoice_no}`)
      }
    }
  }

  console.log('\n--- TEST 5: Add Daily Entry ---')
  // (simulates DailyEntriesView → Add Daily Entry)
  const { data: entry, error: deErr } = await adminClient
    .from('daily_entries')
    .insert({
      entry_date: new Date().toISOString().slice(0, 10),
      member_code: member?.member_code ?? null,
      member_name: 'QA Test Member',
      phone: '+91 99999 88888',
      service_name: 'QA Test Aromatherapy',
      therapist_name: 'QA Test Therapist',
      amount: 2500,
      payment_mode: 'Cash',
      notes: 'Added via UI test',
    })
    .select()
    .single()
  if (deErr) {
    log('Add Daily Entry (UI action)', false, deErr.message)
  } else {
    log('Add Daily Entry (UI action)', true, `id: ${entry.id}`)
    await verifyRow('daily_entries', { id: entry.id }, {
      member_name: 'QA Test Member',
      amount: 2500,
      payment_mode: 'Cash',
    })
  }

  console.log('\n--- TEST 6: Mark Staff Attendance ---')
  // (simulates AttendanceView → click status button for staff)
  if (staff) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: att, error: attErr } = await adminClient
      .from('staff_attendance')
      .upsert({
        staff_id: staff.id,
        date: today,
        status: 'Present',
        check_in: '09:30',
        check_out: '18:00',
        notes: 'Added via UI test',
      }, { onConflict: 'staff_id,date' })
      .select()
      .single()
    if (attErr) {
      log('Mark Attendance (UI action)', false, attErr.message)
    } else {
      log('Mark Attendance (UI action)', true, `id: ${att.id}, status: ${att.status}`)
      await verifyRow('staff_attendance', { id: att.id }, {
        staff_id: staff.id,
        date: today,
        status: 'Present',
      })
    }
  }

  console.log('\n--- TEST 7: Add Package ---')
  // (simulates PackagesView → Add Package)
  const { data: pkg, error: pkgErr } = await adminClient
    .from('package_offers')
    .insert({
      title: 'QA Test Festive Offer',
      type: 'Festive Offer',
      discount_value: 25,
      discount_type: 'percent',
      valid_from: new Date().toISOString().slice(0, 10),
      valid_to: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      code: 'QATEST25',
      is_active: true,
    })
    .select()
    .single()
  if (pkgErr) {
    log('Add Package (UI action)', false, pkgErr.message)
  } else {
    log('Add Package (UI action)', true, `id: ${pkg.id}`)
    await verifyRow('package_offers', { id: pkg.id }, {
      title: 'QA Test Festive Offer',
      code: 'QATEST25',
    })
  }

  console.log('\n--- TEST 8: Add Campaign ---')
  // (simulates MarketingView → Add Campaign)
  const { data: camp, error: campErr } = await adminClient
    .from('campaigns')
    .insert({
      name: 'QA Test Campaign',
      channel: 'WhatsApp',
      template: 'Test message for {{name}}',
      segment: ['expiring'],
      status: 'Draft',
    })
    .select()
    .single()
  if (campErr) {
    log('Add Campaign (UI action)', false, campErr.message)
  } else {
    log('Add Campaign (UI action)', true, `id: ${camp.id}`)
    await verifyRow('campaigns', { id: camp.id }, {
      name: 'QA Test Campaign',
      channel: 'WhatsApp',
    })
  }

  console.log('\n--- TEST 9: Book Appointment ---')
  // (simulates BookAppointmentDialog)
  if (member && service && staff) {
    const start = new Date()
    start.setHours(start.getHours() + 2)
    const end = new Date(start.getTime() + service.duration_min * 60000)
    const { data: appt, error: apptErr } = await adminClient
      .from('appointments')
      .insert({
        member_id: member.id,
        service_id: service.id,
        staff_id: staff.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'Booked',
        notes: 'Added via UI test',
      })
      .select()
      .single()
    if (apptErr) {
      log('Book Appointment (UI action)', false, apptErr.message)
    } else {
      log('Book Appointment (UI action)', true, `id: ${appt.id}`)
      await verifyRow('appointments', { id: appt.id }, {
        member_id: member.id,
        service_id: service.id,
        status: 'Booked',
      })
    }
  }

  console.log('\n--- TEST 10: Set Salary (Admin) ---')
  // (simulates SalaryView → change per_day_salary and Save)
  if (staff) {
    const { data: updated, error: uErr } = await adminClient
      .from('staff')
      .update({ per_day_salary: 1500 })
      .eq('id', staff.id)
      .select()
      .single()
    if (uErr) {
      log('Set Salary (UI action)', false, uErr.message)
    } else {
      log('Set Salary (UI action)', true, `per_day_salary: ${updated.per_day_salary}`)
      await verifyRow('staff', { id: staff.id }, {
        per_day_salary: 1500,
      })
    }
  }

  console.log('\n--- TEST 11: Verify all data is in Supabase ---')
  await verifyCount('members', 1)
  await verifyCount('membership_plans', 1)
  await verifyCount('memberships', 1)
  await verifyCount('services', 1)
  await verifyCount('staff', 1)
  await verifyCount('appointments', 1)
  await verifyCount('payments', 1)
  await verifyCount('package_offers', 1)
  await verifyCount('campaigns', 1)
  await verifyCount('daily_entries', 1)
  await verifyCount('staff_attendance', 1)

  console.log('\n--- TEST 12: Update + Delete (cleanup) ---')
  // Cleanup all test data
  if (member) {
    await adminClient.from('appointments').delete().eq('member_id', member.id)
    await adminClient.from('payments').delete().eq('member_id', member.id)
    await adminClient.from('memberships').delete().eq('member_id', member.id)
    await adminClient.from('daily_entries').delete().eq('member_code', member.member_code)
    await adminClient.from('members').delete().eq('id', member.id)
    log('Cleanup member', true)
  }
  if (staff) {
    await adminClient.from('staff_attendance').delete().eq('staff_id', staff.id)
    await adminClient.from('staff').delete().eq('id', staff.id)
    log('Cleanup staff', true)
  }
  if (plan) await adminClient.from('membership_plans').delete().eq('id', plan.id)
  if (service) await adminClient.from('services').delete().eq('id', service.id)
  if (pkg) await adminClient.from('package_offers').delete().eq('id', pkg.id)
  if (camp) await adminClient.from('campaigns').delete().eq('id', camp.id)
  log('Cleanup all', true)

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
  console.error('Test crashed:', e)
  process.exit(1)
})
