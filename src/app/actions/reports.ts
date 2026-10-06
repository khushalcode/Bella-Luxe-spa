'use server'

import { db } from '@/lib/db'
import type {
  RevenuePoint,
  MemberGrowthPoint,
  PlanPerformancePoint,
  RetentionPoint,
} from '@/lib/types'

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short' })
}

export async function getRevenueReport(): Promise<RevenuePoint[]> {
  const now = new Date()
  const months: Date[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d)
  }
  const payments = await db.payment.findMany({
    where: { status: 'Paid' },
    select: { amount: true, paidAt: true },
  })
  const buckets: Record<string, number> = {}
  for (const m of months) buckets[monthKey(m)] = 0
  for (const p of payments) {
    const d = new Date(p.paidAt)
    const k = monthKey(d)
    if (k in buckets) buckets[k] += p.amount
  }
  return months.map((m) => ({
    month: monthLabel(m),
    revenue: buckets[monthKey(m)] ?? 0,
  }))
}

export async function getMemberGrowthReport(): Promise<MemberGrowthPoint[]> {
  const now = new Date()
  const months: Date[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d)
  }
  const members = await db.member.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  // cumulative count up to end of each month
  const endOfMonths = months.map((m) => new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999))
  return months.map((m, i) => {
    const end = endOfMonths[i]
    const cumulative = members.filter((mem) => new Date(mem.createdAt) <= end).length
    return { month: monthLabel(m), members: cumulative }
  })
}

export async function getPlanPerformanceReport(): Promise<PlanPerformancePoint[]> {
  const plans = await db.membershipPlan.findMany({
    include: {
      memberships: {
        include: { payments: { where: { status: 'Paid' }, select: { amount: true } } },
      },
    },
    orderBy: { price: 'desc' },
  })
  return plans.map((p: any) => {
    const memberCount = p.memberships.length
    const revenue = p.memberships.reduce(
      (sum: number, m: any) =>
        sum + m.payments.reduce((s: number, x: any) => s + x.amount, 0),
      0
    )
    return { plan: p.name, members: memberCount, revenue }
  })
}

export async function getRetentionReport(): Promise<RetentionPoint[]> {
  const [active, expired] = await Promise.all([
    db.membership.count({ where: { status: 'Active' } }),
    db.membership.count({ where: { status: 'Expired' } }),
  ])
  return [
    { name: 'Retained', value: active, color: '#2E9E6E' },
    { name: 'Churned', value: expired, color: '#D9364B' },
  ]
}
