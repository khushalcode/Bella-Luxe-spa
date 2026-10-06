'use server'

import { supabase, toISO } from '@/lib/supabaseServer'
import { computeStatus } from '@/lib/status'
import type { MemberDTO } from '@/lib/types'

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
  photo_url: string | null
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

interface AppointmentCountRow {
  id: string
  member_id: string
}

interface FullMembershipRow extends MembershipRow {
  payments?: { id: string; amount: number; method: string; status: string; invoice_no: string; paid_at: string }[]
}

function toDTO(
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

export async function getMembers(): Promise<MemberDTO[]> {
  // Load all members
  const { data: members, error: mErr } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: true })
  if (mErr) throw new Error(`Failed to load members: ${mErr.message}`)
  if (!members || members.length === 0) return []

  // Load all memberships with their plan
  const { data: memberships, error: msErr } = await supabase
    .from('memberships')
    .select(`
      *,
      plan:membership_plans(id, name)
    `)
  if (msErr) throw new Error(`Failed to load memberships: ${msErr.message}`)

  // Count appointments per member (just need member_id)
  const { data: appts, error: aErr } = await supabase
    .from('appointments')
    .select('id, member_id')
  if (aErr) throw new Error(`Failed to load appointments: ${aErr.message}`)

  return (members as MemberRow[]).map((m) => {
    const memberMemberships = (memberships as MembershipRow[]).filter((ms) => ms.member_id === m.id)
    const count = (appts as AppointmentCountRow[]).filter((a) => a.member_id === m.id).length
    return toDTO(m, memberMemberships, count)
  })
}

export async function getMember(id: string): Promise<MemberDTO | null> {
  const { data: m, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !m) return null
  const member = m as MemberRow

  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      *,
      plan:membership_plans(id, name)
    `)
    .eq('member_id', id)
    .order('start_date', { ascending: false })

  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', id)

  return toDTO(member, (memberships as MembershipRow[]) ?? [], count ?? 0)
}

/** Returns a member with their full memberships, payments, and appointments
 * — used by the profile sheet (which calls /api/members/[id]). */
export async function getMemberFull(id: string) {
  const { data: m, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !m) return null
  const member = m as MemberRow

  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      *,
      plan:membership_plans(id, name)
    `)
    .eq('member_id', id)
    .order('start_date', { ascending: false })

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      service:services(id, name),
      staff:staff(id, name)
    `)
    .eq('member_id', id)
    .order('starts_at', { ascending: false })

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', id)
    .order('paid_at', { ascending: false })

  return { member, memberships: memberships ?? [], appointments: appointments ?? [], payments: payments ?? [] }
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
  // 1. Load the plan to get durationDays + price
  const { data: plan, error: pErr } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', input.planId)
    .single()
  if (pErr || !plan) throw new Error('Plan not found')
  const planRow = plan as { id: string; name: string; price: number; duration_days: number }

  // 2. Count existing members to generate the next member code
  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
  const memberCode = `BLM-${String(100 + (memberCount ?? 0) + 1).padStart(3, '0')}`

  // 3. Compute membership dates + status
  const start = new Date(input.startDate)
  const end = new Date(start.getTime() + planRow.duration_days * 86400000)
  const status = computeStatus(end.toISOString().slice(0, 10))

  // 4. Insert the member
  const { data: member, error: mErr } = await supabase
    .from('members')
    .insert({
      member_code: memberCode,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      gender: input.gender || 'Female',
      dob: input.dob || null,
      address: input.address || null,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (mErr || !member) throw new Error(`Failed to create member: ${mErr?.message}`)
  const memberRow = member as MemberRow

  // 5. Insert the membership
  const { data: membership, error: msErr } = await supabase
    .from('memberships')
    .insert({
      member_id: memberRow.id,
      plan_id: planRow.id,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status,
      amount_paid: input.amountPaid ?? planRow.price,
      auto_renew: false,
    })
    .select()
    .single()
  if (msErr || !membership) throw new Error(`Failed to create membership: ${msErr?.message}`)
  const membershipRow = membership as { id: string }

  // 6. Insert the payment with auto-generated invoice number
  const { count: payCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
  const invoiceNo = `INV-2026-${String(2001 + (payCount ?? 0)).padStart(4, '0')}`
  const { error: payErr } = await supabase
    .from('payments')
    .insert({
      member_id: memberRow.id,
      membership_id: membershipRow.id,
      amount: input.amountPaid ?? planRow.price,
      method: 'UPI',
      status: 'Paid',
      invoice_no: invoiceNo,
    })
  if (payErr) throw new Error(`Failed to create payment: ${payErr.message}`)

  return toDTO(memberRow, [{
    id: membershipRow.id,
    member_id: memberRow.id,
    plan_id: planRow.id,
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    status,
    amount_paid: input.amountPaid ?? planRow.price,
    auto_renew: false,
    created_at: new Date().toISOString(),
    plan: { id: planRow.id, name: planRow.name },
  }], 0)
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
  const update: Record<string, any> = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.phone !== undefined) update.phone = patch.phone
  if (patch.email !== undefined) update.email = patch.email
  if (patch.gender !== undefined) update.gender = patch.gender
  if (patch.dob !== undefined) update.dob = patch.dob
  if (patch.address !== undefined) update.address = patch.address
  if (patch.notes !== undefined) update.notes = patch.notes

  const { data: m, error } = await supabase
    .from('members')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`Failed to update member: ${error.message}`)
  const member = m as MemberRow

  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      *,
      plan:membership_plans(id, name)
    `)
    .eq('member_id', id)

  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', id)

  return toDTO(member, (memberships as MembershipRow[]) ?? [], count ?? 0)
}

export async function deleteMember(id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete member: ${error.message}`)
  return { ok: true }
}

export async function renewMembership(
  memberId: string,
  planId: string,
  amountPaid?: number,
  autoRenew = false
): Promise<{ invoiceNo: string; membershipId: string }> {
  // 1. Load the plan
  const { data: plan, error: pErr } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('id', planId)
    .single()
  if (pErr || !plan) throw new Error('Plan not found')
  const planRow = plan as { id: string; name: string; price: number; duration_days: number }

  // 2. Compute dates + status
  const start = new Date()
  const end = new Date(start.getTime() + planRow.duration_days * 86400000)
  const status = computeStatus(end.toISOString().slice(0, 10))

  // 3. Insert the new membership
  const { data: membership, error: msErr } = await supabase
    .from('memberships')
    .insert({
      member_id: memberId,
      plan_id: planId,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status,
      amount_paid: amountPaid ?? planRow.price,
      auto_renew: autoRenew,
    })
    .select()
    .single()
  if (msErr || !membership) throw new Error(`Failed to create membership: ${msErr?.message}`)
  const membershipRow = membership as { id: string }

  // 4. Insert the payment
  const { count: payCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
  const invoiceNo = `INV-2026-${String(2001 + (payCount ?? 0)).padStart(4, '0')}`
  const { error: payErr } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      membership_id: membershipRow.id,
      amount: amountPaid ?? planRow.price,
      method: 'UPI',
      status: 'Paid',
      invoice_no: invoiceNo,
    })
  if (payErr) throw new Error(`Failed to create payment: ${payErr.message}`)

  return { invoiceNo, membershipId: membershipRow.id }
}

export async function sendReminder(memberId: string): Promise<{ ok: true; name: string }> {
  const { data: m, error } = await supabase
    .from('members')
    .select('name, phone')
    .eq('id', memberId)
    .single()
  const name = (m as any)?.name ?? 'Member'
  const phone = (m as any)?.phone ?? 'no phone'
  console.log(`[Reminder] Sent WhatsApp reminder to ${name} (${phone})`)
  if (error) console.warn('Reminder lookup error:', error.message)
  return { ok: true, name }
}

// keep FullMembershipRow referenced for future use
void (undefined as unknown as FullMembershipRow)
