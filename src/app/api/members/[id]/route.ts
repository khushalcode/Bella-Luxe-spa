import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseServer'
import { computeStatus } from '@/lib/status'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await getSupabase()
  const { id } = await params

  // Load the member
  const { data: m, error: mErr } = await sb
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  if (mErr || !m) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const member = m as any

  // Load memberships + plans
  const { data: membershipsRaw } = await sb
    .from('memberships')
    .select(`
      *,
      plan:membership_plans(id, name)
    `)
    .eq('member_id', id)
    .order('start_date', { ascending: false })

  // Load appointments + services + staff
  const { data: appointmentsRaw } = await sb
    .from('appointments')
    .select(`
      *,
      service:services(id, name),
      staff:staff(id, name)
    `)
    .eq('member_id', id)
    .order('starts_at', { ascending: false })

  // Load payments
  const { data: paymentsRaw } = await sb
    .from('payments')
    .select('*')
    .eq('member_id', id)
    .order('paid_at', { ascending: false })

  const memberships = (membershipsRaw ?? []) as any[]
  const appointments = (appointmentsRaw ?? []) as any[]
  const payments = (paymentsRaw ?? []) as any[]

  const latest =
    memberships.slice().sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    )[0] ?? null

  return NextResponse.json({
    id: member.id,
    memberCode: member.member_code,
    name: member.name,
    phone: member.phone,
    email: member.email,
    gender: member.gender,
    dob: member.dob,
    address: member.address,
    notes: member.notes,
    createdAt: typeof member.created_at === 'string' ? member.created_at : new Date(member.created_at).toISOString(),
    currentPlanName: latest?.plan?.name ?? null,
    currentPlanId: latest?.plan_id ?? null,
    membershipStatus: latest?.status ?? computeStatus(latest?.end_date ?? ''),
    membershipStart: latest?.start_date ?? null,
    membershipEnd: latest?.end_date ?? null,
    amountPaid: latest?.amount_paid ?? 0,
    visits: appointments.length,
    memberships: memberships.map((mm) => ({
      id: mm.id,
      memberId: mm.member_id,
      planId: mm.plan_id,
      planName: mm.plan?.name ?? '',
      startDate: mm.start_date,
      endDate: mm.end_date,
      status: mm.status,
      amountPaid: mm.amount_paid,
      autoRenew: mm.auto_renew,
      createdAt: typeof mm.created_at === 'string' ? mm.created_at : new Date(mm.created_at).toISOString(),
    })),
    appointments: appointments.map((a) => ({
      id: a.id,
      memberId: a.member_id,
      serviceId: a.service_id,
      serviceName: a.service?.name ?? '',
      staffId: a.staff_id ?? null,
      staffName: a.staff?.name ?? null,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      status: a.status,
      notes: a.notes,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      memberId: p.member_id,
      membershipId: p.membership_id ?? null,
      appointmentId: p.appointment_id ?? null,
      description: 'Membership Payment',
      amount: p.amount,
      method: p.method,
      status: p.status,
      invoiceNo: p.invoice_no,
      paidAt: typeof p.paid_at === 'string' ? p.paid_at : new Date(p.paid_at).toISOString(),
    })),
  })
}
