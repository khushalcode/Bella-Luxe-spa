'use server'

import { db } from '@/lib/db'
import type { PaymentDTO } from '@/lib/types'

function toDTO(p: any): PaymentDTO {
  return {
    id: p.id,
    memberId: p.memberId,
    memberName: p.member?.name,
    membershipId: p.membershipId ?? null,
    appointmentId: p.appointmentId ?? null,
    description: p.membership?.plan?.name
      ? `${p.membership.plan.name} Membership`
      : p.appointmentId
      ? 'Appointment Payment'
      : 'General Payment',
    amount: p.amount,
    method: p.method,
    status: p.status,
    invoiceNo: p.invoiceNo,
    paidAt: p.paidAt?.toISOString?.() ?? String(p.paidAt),
  }
}

export async function getPayments(): Promise<PaymentDTO[]> {
  const rows = await db.payment.findMany({
    include: {
      member: true,
      membership: { include: { plan: true } },
    },
    orderBy: { paidAt: 'desc' },
  })
  return rows.map(toDTO)
}

export interface CreatePaymentInput {
  memberId: string
  amount: number
  method: string
  status?: string
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<PaymentDTO & { invoiceNo: string }> {
  const invCount = await db.payment.count()
  const invoiceNo = `INV-2026-${String(2001 + invCount).padStart(4, '0')}`
  const p = await db.payment.create({
    data: {
      memberId: input.memberId,
      amount: input.amount,
      method: input.method,
      status: input.status ?? 'Paid',
      invoiceNo,
    },
    include: {
      member: true,
      membership: { include: { plan: true } },
    },
  })
  return { ...toDTO(p), invoiceNo }
}

export async function refundPayment(id: string): Promise<PaymentDTO> {
  const p = await db.payment.update({
    where: { id },
    data: { status: 'Refunded' },
    include: {
      member: true,
      membership: { include: { plan: true } },
    },
  })
  return toDTO(p)
}
