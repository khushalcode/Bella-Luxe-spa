'use server'

import { supabase } from '@/lib/supabaseServer'
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
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, paid_at')
    .eq('status', 'Paid')
  if (error) throw new Error(`Failed to load revenue report: ${error.message}`)
  const buckets: Record<string, number> = {}
  for (const m of months) buckets[monthKey(m)] = 0
  for (const p of (payments ?? []) as { amount: number; paid_at: string }[]) {
    const d = new Date(p.paid_at)
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
  const { data: members, error } = await supabase
    .from('members')
    .select('created_at')
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Failed to load member growth: ${error.message}`)
  const endOfMonths = months.map((m) => new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999))
  return months.map((m, i) => {
    const end = endOfMonths[i]
    const cumulative = (members ?? []).filter((mem: any) => new Date(mem.created_at) <= end).length
    return { month: monthLabel(m), members: cumulative }
  })
}

export async function getPlanPerformanceReport(): Promise<PlanPerformancePoint[]> {
  const { data: plans, error } = await supabase
    .from('membership_plans')
    .select(`
      *,
      memberships:memberships(
        id,
        payments:payments(amount)
      )
    `)
    .order('price', { ascending: false })
  if (error) throw new Error(`Failed to load plan performance: ${error.message}`)
  return (plans as any[]).map((p) => {
    const memberCount = p.memberships?.length ?? 0
    const revenue = (p.memberships ?? []).reduce((sum: number, m: any) => {
      const paid = (m.payments ?? []).filter((pay: any) => pay.amount > 0)
      return sum + paid.reduce((s: number, x: any) => s + x.amount, 0)
    }, 0)
    return { plan: p.name, members: memberCount, revenue }
  })
}

export async function getRetentionReport(): Promise<RetentionPoint[]> {
  const { count: active, error: aErr } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Active')
  if (aErr) throw new Error(`Failed to load retention: ${aErr.message}`)
  const { count: expired, error: eErr } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Expired')
  if (eErr) throw new Error(`Failed to load retention: ${eErr.message}`)
  return [
    { name: 'Retained', value: active ?? 0, color: '#2E9E6E' },
    { name: 'Churned', value: expired ?? 0, color: '#D9364B' },
  ]
}
