'use server'

import { getSupabase } from '@/lib/supabaseServer'
import type { PlanDTO } from '@/lib/types'

interface PlanRow {
  id: string
  name: string
  price: number
  duration_days: number
  sessions_included: number
  discount_pct: number
  benefits: any
  is_active: boolean
  created_at: string
}

interface MembershipRow {
  id: string
  plan_id: string
}

interface PaymentRow {
  amount: number
}

function safeParse(s: any): string[] {
  if (Array.isArray(s)) return s
  try { return JSON.parse(s) } catch { return [] }
}

function toDTO(p: PlanRow, memberCount = 0, revenue = 0): PlanDTO {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    durationDays: p.duration_days,
    sessionsIncluded: p.sessions_included,
    discountPct: p.discount_pct,
    benefits: safeParse(p.benefits),
    isActive: p.is_active,
    memberCount,
    revenue,
  }
}

export async function getPlans(): Promise<PlanDTO[]> {
  const sb = await getSupabase()
  // Load all plans
  const { data: plans, error } = await sb
    .from('membership_plans')
    .select('*')
    .order('price', { ascending: false })
  if (error) throw new Error(`Failed to load plans: ${error.message}`)
  if (!plans || plans.length === 0) return []

  // Load all memberships (just plan_id)
  const { data: memberships, error: mErr } = await sb
    .from('memberships')
    .select('id, plan_id')
  if (mErr) throw new Error(`Failed to load memberships: ${mErr.message}`)

  // Load all paid payments (membership_id, amount)
  const { data: payments, error: pErr } = await sb
    .from('payments')
    .select('membership_id, amount')
    .eq('status', 'Paid')
  if (pErr) throw new Error(`Failed to load payments: ${pErr.message}`)

  // Aggregate in JS
  return (plans as PlanRow[]).map((p) => {
    const planMemberships = (memberships as MembershipRow[]).filter((m) => m.plan_id === p.id)
    const memberCount = planMemberships.length
    const membershipIds = new Set(planMemberships.map((m) => m.id))
    const revenue = (payments as PaymentRow[])
      .filter((pay) => pay.membership_id && membershipIds.has(pay.membership_id))
      .reduce((s, p) => s + p.amount, 0)
    return toDTO(p, memberCount, revenue)
  })
}

export interface CreatePlanInput {
  name: string
  price: number
  durationDays: number
  sessionsIncluded: number
  discountPct: number
  benefits: string[]
  isActive?: boolean
}

export async function createPlan(input: CreatePlanInput): Promise<PlanDTO> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('membership_plans')
    .insert({
      name: input.name,
      price: input.price,
      duration_days: input.durationDays,
      sessions_included: input.sessionsIncluded,
      discount_pct: input.discountPct,
      benefits: input.benefits,
      is_active: input.isActive ?? true,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create plan: ${error.message}`)
  return toDTO(data as PlanRow, 0, 0)
}

export async function updatePlan(id: string, patch: Partial<CreatePlanInput>): Promise<PlanDTO> {
  const sb = await getSupabase()
  const update: Record<string, any> = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.price !== undefined) update.price = patch.price
  if (patch.durationDays !== undefined) update.duration_days = patch.durationDays
  if (patch.sessionsIncluded !== undefined) update.sessions_included = patch.sessionsIncluded
  if (patch.discountPct !== undefined) update.discount_pct = patch.discountPct
  if (patch.benefits !== undefined) update.benefits = patch.benefits
  if (patch.isActive !== undefined) update.is_active = patch.isActive

  const { data, error } = await sb
    .from('membership_plans')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update plan: ${error.message}`)
  return toDTO(data as PlanRow, 0, 0)
}

export async function togglePlan(id: string): Promise<{ ok: true; isActive: boolean }> {
  const sb = await getSupabase()
  const { data: cur, error: e1 } = await sb
    .from('membership_plans')
    .select('is_active')
    .eq('id', id)
    .single()
  if (e1 || !cur) throw new Error('Plan not found')
  const next = !(cur as any).is_active
  const { error: e2 } = await sb
    .from('membership_plans')
    .update({ is_active: next })
    .eq('id', id)
  if (e2) throw new Error(`Failed to toggle plan: ${e2.message}`)
  return { ok: true, isActive: next }
}

export async function deletePlan(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb.from('membership_plans').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete plan: ${error.message}`)
  return { ok: true }
}
