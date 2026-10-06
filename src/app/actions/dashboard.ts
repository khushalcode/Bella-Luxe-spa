'use server'

import { db } from '@/lib/db'
import type { DashboardSummary, MemberDTO, MembershipDTO, AppointmentDTO } from '@/lib/types'
import {
  getTodayEntriesSummary,
  getPreviousMonthReportMeta,
} from './dailyEntries'
import { getTodayAttendanceSummary } from './attendance'

function memberToDTO(m: any): MemberDTO {
  const latestMembership =
    m.memberships?.slice?.().sort((a: any, b: any) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )?.[0] ?? null
  const visits = m.appointments?.length ?? 0
  return {
    id: m.id,
    memberCode: m.memberCode,
    name: m.name,
    phone: m.phone,
    email: m.email ?? null,
    gender: m.gender,
    dob: m.dob ?? null,
    address: m.address ?? null,
    notes: m.notes ?? null,
    createdAt: m.createdAt?.toISOString?.() ?? String(m.createdAt),
    currentPlanName: latestMembership?.plan?.name ?? null,
    currentPlanId: latestMembership?.planId ?? null,
    membershipStatus: latestMembership?.status ?? null,
    membershipStart: latestMembership?.startDate ?? null,
    membershipEnd: latestMembership?.endDate ?? null,
    amountPaid: latestMembership?.amountPaid ?? 0,
    visits,
  }
}

function membershipToDTO(m: any): MembershipDTO {
  return {
    id: m.id,
    memberId: m.memberId,
    planId: m.planId,
    planName: m.plan?.name ?? '',
    memberName: m.member?.name ?? '',
    startDate: m.startDate,
    endDate: m.endDate,
    status: m.status,
    amountPaid: m.amountPaid,
    autoRenew: m.autoRenew,
    createdAt: m.createdAt?.toISOString?.() ?? String(m.createdAt),
  }
}

function aptToDTO(a: any): AppointmentDTO {
  return {
    id: a.id,
    memberId: a.memberId,
    memberName: a.member?.name,
    serviceId: a.serviceId,
    serviceName: a.service?.name,
    staffId: a.staffId ?? null,
    staffName: a.staff?.name ?? null,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
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

  const [
    totalMembers,
    allMemberships,
    paidPayments,
    paymentsThisMonth,
    paymentsLastMonth,
    newMembersThisMonth,
    recentMembersRaw,
    todaysApptsRaw,
  ] = await Promise.all([
    db.member.count(),
    db.membership.findMany({ select: { status: true, memberId: true, endDate: true } }),
    db.payment.findMany({ where: { status: 'Paid' }, select: { amount: true, paidAt: true } }),
    db.payment.findMany({
      where: { status: 'Paid', paidAt: { gte: thisMonthStart, lte: now } },
      select: { amount: true },
    }),
    db.payment.findMany({
      where: { status: 'Paid', paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      select: { amount: true },
    }),
    db.member.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.member.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: { include: { plan: true }, orderBy: { startDate: 'desc' } },
        appointments: { select: { id: true } },
      },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: todayStart.toISOString(), lte: todayEnd.toISOString() } },
      include: { member: true, service: true, staff: true },
      orderBy: { startsAt: 'asc' },
    }),
  ])

  const activeMemberships = allMemberships.filter((m) => m.status === 'Active').length
  const expiringSoon = allMemberships.filter((m) => m.status === 'Expiring Soon').length
  const expired = allMemberships.filter((m) => m.status === 'Expired').length

  const totalRevenue = paidPayments.reduce((s, p) => s + p.amount, 0)
  const revenueThisMonth = paymentsThisMonth.reduce((s, p) => s + p.amount, 0)
  const revenueLastMonth = paymentsLastMonth.reduce((s, p) => s + p.amount, 0)

  // Popular plans — aggregate in JS for SQLite (no group by)
  const plans = await db.membershipPlan.findMany({
    include: {
      memberships: {
        include: { payments: { where: { status: 'Paid' }, select: { amount: true } } },
      },
    },
  })
  const popularPlans = plans
    .map((p: any) => {
      const memberCount = p.memberships.length
      const revenue = p.memberships.reduce(
        (sum: number, m: any) =>
          sum + m.payments.reduce((s: number, x: any) => s + x.amount, 0),
        0
      )
      return { id: p.id, name: p.name, memberCount, revenue, price: p.price }
    })
    .sort((a, b) => b.memberCount - a.memberCount)

  // Upcoming expirations — Expiring Soon or Expired, sorted by endDate asc
  const expAptsRaw = await db.membership.findMany({
    where: { status: 'Expiring Soon' },
    include: { member: true, plan: true },
    orderBy: { endDate: 'asc' },
    take: 5,
  })

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
      newMembersThisMonth,
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
    recentMembers: recentMembersRaw.map(memberToDTO),
    upcomingExpirations: expAptsRaw.map(membershipToDTO),
    todaysAppointments: todaysApptsRaw.map(aptToDTO),
    todaysEntries: todaysEntriesRes.entries,
    lastMonthReport,
  }
}
