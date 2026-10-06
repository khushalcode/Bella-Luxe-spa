'use server'

import { supabase, toISO } from '@/lib/supabaseServer'
import type { PaymentDTO } from '@/lib/types'

interface PaymentRow {
  id: string
  member_id: string
  membership_id: string | null
  appointment_id: string | null
  amount: number
  method: string
  status: string
  invoice_no: string
  paid_at: string
  member?: { id: string; name: string } | null
  membership?: {
    id: string
    plan: { id: string; name: string } | null
  } | null
}

function toDTO(p: PaymentRow): PaymentDTO {
  return {
    id: p.id,
    memberId: p.member_id,
    memberName: p.member?.name ?? undefined,
    membershipId: p.membership_id ?? null,
    appointmentId: p.appointment_id ?? null,
    description: p.membership?.plan?.name
      ? `${p.membership.plan.name} Membership`
      : p.appointment_id
      ? 'Appointment Payment'
      : 'General Payment',
    amount: p.amount,
    method: p.method,
    status: p.status,
    invoiceNo: p.invoice_no,
    paidAt: toISO(p.paid_at),
  }
}

export async function getPayments(): Promise<PaymentDTO[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      member:members(id, name),
      membership:memberships(id, plan:membership_plans(id, name))
    `)
    .order('paid_at', { ascending: false })
  if (error) throw new Error(`Failed to load payments: ${error.message}`)
  return (data as PaymentRow[]).map(toDTO)
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
  // Count existing payments to generate the next invoice number
  const { count, error: cErr } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
  if (cErr) throw new Error(`Failed to count payments: ${cErr.message}`)
  const invoiceNo = `INV-2026-${String(2001 + (count ?? 0)).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('payments')
    .insert({
      member_id: input.memberId,
      amount: input.amount,
      method: input.method,
      status: input.status ?? 'Paid',
      invoice_no: invoiceNo,
    })
    .select(`
      *,
      member:members(id, name),
      membership:memberships(id, plan:membership_plans(id, name))
    `)
    .single()
  if (error) throw new Error(`Failed to create payment: ${error.message}`)
  return { ...toDTO(data as PaymentRow), invoiceNo }
}

export async function refundPayment(id: string): Promise<PaymentDTO> {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'Refunded' })
    .eq('id', id)
    .select(`
      *,
      member:members(id, name),
      membership:memberships(id, plan:membership_plans(id, name))
    `)
    .single()
  if (error) throw new Error(`Failed to refund payment: ${error.message}`)
  return toDTO(data as PaymentRow)
}
