'use server'

import { supabase, toISO } from '@/lib/supabaseServer'
import type { DashboardSummary, MemberDTO, MembershipDTO, AppointmentDTO } from '@/lib/types'
import {
  getTodayEntriesSummary,
  getPreviousMonthReportMeta,
} from './dailyEntries'
import { getTodayAttendanceSummary } from './attendance'

interface MemberRow {
  id: string
  member_code: string
  name: string
  phone: string
  email: string | null
  gender: string
  dob: string | null
  address: string | null
  notes: string | null
  created_at: string
}

interface MembershipRow {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  status: string
  amount_paid: number
  auto_renew: boolean
  created_at: string
  plan?: { id: string; name: string } | null
}

interface AppointmentRow {
  id: string
  member_id: string
  service_id: string
  staff_id: string | null
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
  member?: { id: string; name: string } | null
  service?: { id: string; name: string } | null
  staff?: { id: string; name: string } | null
}

function memberToDTO(
  m: MemberRow,
  memberships: MembershipRow[] = [],
  appointmentCount = 0
): MemberDTO {
  const latestMembership = memberships
    .slice()
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0] ?? null
  return {
    id: m.id,
    memberCode: m.member_code,
    name: m.name,
    phone: m.phone,
    email: m.email ?? null,
    gender: m.gender,
    dob: m.dob ?? null,
    address: m.address ?? null,
    notes: m.notes ?? null,
    createdAt: toISO(m.created_at),
    currentPlanName: latestMembership?.plan?.name ?? null,
    currentPlanId: latestMembership?.plan_id ?? null,
    membershipStatus: latestMembership?.status as MemberDTO['membershipStatus'] ?? null,
    membershipStart: latestMembership?.start_date ?? null,
    membershipEnd: latestMembership?.end_date ?? null,
    amountPaid: latestMembership?.amount_paid ?? 0,
    visits: appointmentCount,
  }
}

function membershipToDTO(
  m: MembershipRow,
  memberName = ''
): MembershipDTO {
  return {
    id: m.id,
    memberId: m.member_id,
    planId: m.plan_id,
    planName: m.plan?.name ?? '',
    memberName,
    startDate: m.start_date,
    endDate: m.end_date,
    status: m.status as MembershipDTO['status'],
    amountPaid: m.amount_paid,
    autoRenew: m.auto_renew,
    createdAt: toISO(m.created_at),
  }
}

function aptToDTO(a: AppointmentRow): AppointmentDTO {
  return {
    id: a.id,
    memberId: a.member_id,
    memberName: a.member?.name ?? undefined,
    serviceId: a.service_id,
    serviceName: a.service?.name ?? undefined,
    staffId: a.staff_id ?? null,
    staffName: a.staff?.name ?? null,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    status: a.status,
    notes: a.notes ?? null,
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  // Run all the simple reads in parallel
  const [
    membersCount,
    allMemberships,
    paidPayments,
    paymentsThisMonth,
    paymentsLastMonth,
    newMembersThisMonth,
    recentMembers,
    todaysApptsRaw,
    allPlans,
  ] = await Promise.all([
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('memberships').select('status, member_id, end_date'),
    supabase.from('payments').select('amount, paid_at').eq('status', 'Paid'),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'Paid')
      .gte('paid_at', thisMonthStart.toISOString())
      .lte('paid_at', now.toISOString()),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'Paid')
      .gte('paid_at', lastMonthStart.toISOString())
      .lte('paid_at', lastMonthEnd.toISOString()),
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart.toISOString()),
    supabase
      .from('members')
      .select(`
        *,
        memberships:memberships(
          *,
          plan:membership_plans(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('appointments')
      .select(`
        *,
        member:members(id, name),
        service:services(id, name),
        staff:staff(id, name)
      `)
      .gte('starts_at', todayStart.toISOString())
      .lte('starts_at', todayEnd.toISOString())
      .order('starts_at', { ascending: true }),
    supabase.from('membership_plans').select('id, name, price'),
  ])

  if (membersCount.error) throw new Error(`Failed to count members: ${membersCount.error.message}`)
  if (allMemberships.error) throw new Error(`Failed to load memberships: ${allMemberships.error.message}`)
  if (paidPayments.error) throw new Error(`Failed to load payments: ${paidPayments.error.message}`)
  if (paymentsThisMonth.error) throw new Error(`Failed to load month payments: ${paymentsThisMonth.error.message}`)
  if (paymentsLastMonth.error) throw new Error(`Failed to load last-month payments: ${paymentsLastMonth.error.message}`)
  if (newMembersThisMonth.error) throw new Error(`Failed to count new members: ${newMembersThisMonth.error.message}`)
  if (recentMembers.error) throw new Error(`Failed to load recent members: ${recentMembers.error.message}`)
  if (todaysApptsRaw.error) throw new Error(`Failed to load today's appointments: ${todaysApptsRaw.error.message}`)
  if (allPlans.error) throw new Error(`Failed to load plans: ${allPlans.error.message}`)

  const totalMembers = membersCount.count ?? 0

  const membershipList = (allMemberships.data ?? []) as { status: string; member_id: string; end_date: string }[]
  const activeMemberships = membershipList.filter((m) => m.status === 'Active').length
  const expiringSoon = membershipList.filter((m) => m.status === 'Expiring Soon').length
  const expired = membershipList.filter((m) => m.status === 'Expired').length

  const paidPaymentsList = (paidPayments.data ?? []) as { amount: number; paid_at: string }[]
  const totalRevenue = paidPaymentsList.reduce((s, p) => s + p.amount, 0)
  const revenueThisMonth = ((paymentsThisMonth.data ?? []) as { amount: number }[]).reduce((s, p) => s + p.amount, 0)
  const revenueLastMonth = ((paymentsLastMonth.data ?? []) as { amount: number }[]).reduce((s, p) => s + p.amount, 0)

  // Count recent members' appointments
  const recentMemberIds = ((recentMembers.data ?? []) as MemberRow[]).map((m) => m.id)
  let appointmentCountsByMember: Record<string, number> = {}
  if (recentMemberIds.length > 0) {
    const { data: apptsForRecent, error: aErr } = await supabase
      .from('appointments')
      .select('member_id')
      .in('member_id', recentMemberIds)
    if (!aErr && apptsForRecent) {
      for (const r of apptsForRecent as { member_id: string }[]) {
        appointmentCountsByMember[r.member_id] = (appointmentCountsByMember[r.member_id] ?? 0) + 1
      }
    }
  }

  const recentMembersList = (recentMembers.data ?? []) as MemberRow[]
  const recentMembersDTO = recentMembersList.map((m) => {
    const memberMemberships = ((m as any).memberships ?? []) as MembershipRow[]
    return memberToDTO(m, memberMemberships, appointmentCountsByMember[m.id] ?? 0)
  })

  // Popular plans — count memberships per plan + sum paid payments
  const planList = (allPlans.data ?? []) as { id: string; name: string; price: number }[]
  // Build a map of membership_id -> plan_id from allMemberships (we only have status, member_id, end_date — so we need to fetch full memberships)
  const { data: allFullMemberships, error: mErr } = await supabase
    .from('memberships')
    .select('id, plan_id')
  if (mErr) throw new Error(`Failed to load full memberships: ${mErr.message}`)
  const planIdByMembershipId = new Map<string, string>()
  for (const m of (allFullMemberships ?? []) as { id: string; plan_id: string }[]) {
    planIdByMembershipId.set(m.id, m.plan_id)
  }
  const { data: allPaidPayments, error: pErr } = await supabase
    .from('payments')
    .select('membership_id, amount')
    .eq('status', 'Paid')
  if (pErr) throw new Error(`Failed to load paid payments: ${pErr.message}`)
  const popularPlans = planList
    .map((p) => {
      const planMembershipIds = new Set(
        Array.from(planIdByMembershipId.entries())
          .filter(([, pid]) => pid === p.id)
          .map(([mid]) => mid)
      )
      const memberCount = planMembershipIds.size
      const paidPaymentsForPlan = ((allPaidPayments ?? []) as { membership_id: string | null; amount: number }[])
        .filter((pay) => pay.membership_id && planMembershipIds.has(pay.membership_id))
      const revenue = paidPaymentsForPlan.reduce((s, p) => s + p.amount, 0)
      return { id: p.id, name: p.name, memberCount, revenue, price: p.price }
    })
    .sort((a, b) => b.memberCount - a.memberCount)

  // Upcoming expirations
  const { data: expAptsRaw, error: eErr } = await supabase
    .from('memberships')
    .select(`
      *,
      member:members(id, name),
      plan:membership_plans(id, name)
    `)
    .eq('status', 'Expiring Soon')
    .order('end_date', { ascending: true })
    .limit(5)
  if (eErr) throw new Error(`Failed to load expirations: ${eErr.message}`)

  // Today's daily entries + attendance summary + previous month report meta
  const [todaysEntriesRes, attendanceToday, lastMonthReport] = await Promise.all([
    getTodayEntriesSummary(),
    getTodayAttendanceSummary(),
    getPreviousMonthReportMeta(),
  ])

  return {
    kpis: {
      totalMembers,
      activeMemberships,
      expiringSoon,
      expired,
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      newMembersThisMonth: newMembersThisMonth.count ?? 0,
      todayEntryCount: todaysEntriesRes.count,
      todayEntryRevenue: todaysEntriesRes.revenue,
      presentToday: attendanceToday.present,
      absentToday: attendanceToday.absent,
    },
    membershipBreakdown: [
      { name: 'Active', value: activeMemberships, color: '#2E9E6E' },
      { name: 'Expiring Soon', value: expiringSoon, color: '#E08A2E' },
      { name: 'Expired', value: expired, color: '#D9364B' },
    ],
    popularPlans,
    recentMembers: recentMembersDTO,
    upcomingExpirations: ((expAptsRaw.data ?? []) as MembershipRow[]).map((m) =>
      membershipToDTO(m, (m as any).member?.name ?? '')
    ),
    todaysAppointments: ((todaysApptsRaw.data ?? []) as AppointmentRow[]).map(aptToDTO),
    todaysEntries: todaysEntriesRes.entries,
    lastMonthReport,
  }
}
