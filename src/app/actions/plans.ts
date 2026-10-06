'use server'

import { db } from '@/lib/db'
import type { PlanDTO } from '@/lib/types'

function safeParse(s: string): string[] {
  try { return JSON.parse(s) } catch { return [] }
}

function toDTO(p: any, memberCount = 0, revenue = 0): PlanDTO {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    durationDays: p.durationDays,
    sessionsIncluded: p.sessionsIncluded,
    discountPct: p.discountPct,
    benefits: p.benefits ? safeParse(p.benefits) : [],
    isActive: p.isActive,
    memberCount,
    revenue,
  }
}

export async function getPlans(): Promise<PlanDTO[]> {
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
  const p = await db.membershipPlan.create({
    data: {
      name: input.name,
      price: input.price,
      durationDays: input.durationDays,
      sessionsIncluded: input.sessionsIncluded,
      discountPct: input.discountPct,
      benefits: JSON.stringify(input.benefits),
      isActive: input.isActive ?? true,
    },
  })
  return toDTO(p, 0, 0)
}

export async function updatePlan(id: string, patch: Partial<CreatePlanInput>): Promise<PlanDTO> {
  const p = await db.membershipPlan.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.durationDays !== undefined ? { durationDays: patch.durationDays } : {}),
      ...(patch.sessionsIncluded !== undefined ? { sessionsIncluded: patch.sessionsIncluded } : {}),
      ...(patch.discountPct !== undefined ? { discountPct: patch.discountPct } : {}),
      ...(patch.benefits !== undefined ? { benefits: JSON.stringify(patch.benefits) } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  })
  return toDTO(p, 0, 0)
}

export async function togglePlan(id: string): Promise<{ ok: true; isActive: boolean }> {
  const p = await db.membershipPlan.findUnique({ where: { id } })
  if (!p) throw new Error('Plan not found')
  const updated = await db.membershipPlan.update({
    where: { id },
    data: { isActive: !p.isActive },
  })
  return { ok: true, isActive: updated.isActive }
}

export async function deletePlan(id: string): Promise<{ ok: true }> {
  await db.membershipPlan.delete({ where: { id } })
  return { ok: true }
}
