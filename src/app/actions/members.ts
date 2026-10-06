'use server'

import { db } from '@/lib/db'
import { computeStatus } from '@/lib/status'
import type { MemberDTO } from '@/lib/types'

function toDTO(m: any): MemberDTO {
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

export async function getMembers(): Promise<MemberDTO[]> {
  const rows = await db.member.findMany({
    include: {
      memberships: { include: { plan: true } },
      appointments: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toDTO)
}

export async function getMember(id: string): Promise<MemberDTO | null> {
  const m = await db.member.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { plan: true, payments: true },
        orderBy: { startDate: 'desc' },
      },
      appointments: {
        include: { service: true, staff: true },
        orderBy: { startsAt: 'desc' },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
      },
    },
  })
  if (!m) return null
  return toDTO(m)
}

export interface CreateMemberInput {
  name: string
  phone: string
  email?: string
  gender?: string
  dob?: string
  address?: string
  notes?: string
  planId: string
  startDate: string // ISO
  amountPaid?: number
}

export async function createMember(input: CreateMemberInput): Promise<MemberDTO> {
  return db.$transaction(async (tx) => {
    const count = await tx.member.count()
    const memberCode = `BLM-${String(100 + count + 1).padStart(3, '0')}`
    const plan = await tx.membershipPlan.findUnique({ where: { id: input.planId } })
    if (!plan) throw new Error('Plan not found')
    const start = new Date(input.startDate)
    const end = new Date(start.getTime() + plan.durationDays * 86400000)
    const status = computeStatus(end.toISOString().slice(0, 10))

    const member = await tx.member.create({
      data: {
        memberCode,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        gender: input.gender || 'Female',
        dob: input.dob || null,
        address: input.address || null,
        notes: input.notes || null,
      },
    })

    const membership = await tx.membership.create({
      data: {
        memberId: member.id,
        planId: plan.id,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        status,
        amountPaid: input.amountPaid ?? plan.price,
        autoRenew: false,
      },
    })

    const invCount = await tx.payment.count()
    const invoiceNo = `INV-2026-${String(2001 + invCount).padStart(4, '0')}`
    await tx.payment.create({
      data: {
        memberId: member.id,
        membershipId: membership.id,
        amount: input.amountPaid ?? plan.price,
        method: 'UPI',
        status: 'Paid',
        invoiceNo,
      },
    })

    return toDTO(
      await tx.member.findUnique({
        where: { id: member.id },
        include: {
          memberships: { include: { plan: true } },
          appointments: { select: { id: true } },
        },
      })
    )
  })
}

export interface UpdateMemberInput {
  name?: string
  phone?: string
  email?: string | null
  gender?: string
  dob?: string | null
  address?: string | null
  notes?: string | null
}

export async function updateMember(
  id: string,
  patch: UpdateMemberInput
): Promise<MemberDTO> {
  const updated = await db.member.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.email !== undefined ? { email: patch.email } : {}),
      ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
      ...(patch.dob !== undefined ? { dob: patch.dob } : {}),
      ...(patch.address !== undefined ? { address: patch.address } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    },
    include: {
      memberships: { include: { plan: true } },
      appointments: { select: { id: true } },
    },
  })
  return toDTO(updated)
}

export async function deleteMember(id: string): Promise<{ ok: true }> {
  await db.member.delete({ where: { id } })
  return { ok: true }
}

export async function renewMembership(
  memberId: string,
  planId: string,
  amountPaid?: number,
  autoRenew = false
): Promise<{ invoiceNo: string; membershipId: string }> {
  return db.$transaction(async (tx) => {
    const plan = await tx.membershipPlan.findUnique({ where: { id: planId } })
    if (!plan) throw new Error('Plan not found')
    const start = new Date()
    const end = new Date(start.getTime() + plan.durationDays * 86400000)
    const status = computeStatus(end.toISOString().slice(0, 10))
    const membership = await tx.membership.create({
      data: {
        memberId,
        planId,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        status,
        amountPaid: amountPaid ?? plan.price,
        autoRenew,
      },
    })
    const invCount = await tx.payment.count()
    const invoiceNo = `INV-2026-${String(2001 + invCount).padStart(4, '0')}`
    await tx.payment.create({
      data: {
        memberId,
        membershipId: membership.id,
        amount: amountPaid ?? plan.price,
        method: 'UPI',
        status: 'Paid',
        invoiceNo,
      },
    })
    return { invoiceNo, membershipId: membership.id }
  })
}

export async function sendReminder(memberId: string): Promise<{ ok: true; name: string }> {
  const m = await db.member.findUnique({ where: { id: memberId } })
  console.log(`[Reminder] Sent WhatsApp reminder to ${m?.name ?? memberId} (${m?.phone ?? 'no phone'})`)
  return { ok: true, name: m?.name ?? 'Member' }
}
