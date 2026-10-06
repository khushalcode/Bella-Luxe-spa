import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeStatus } from '@/lib/status'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      payments: { orderBy: { paidAt: 'desc' } },
    },
  })
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const latest =
    m.memberships.slice().sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )[0] ?? null

  return NextResponse.json({
    id: m.id,
    memberCode: m.memberCode,
    name: m.name,
    phone: m.phone,
    email: m.email,
    gender: m.gender,
    dob: m.dob,
    address: m.address,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    currentPlanName: latest?.plan?.name ?? null,
    currentPlanId: latest?.planId ?? null,
    membershipStatus: latest?.status ?? computeStatus(latest?.endDate ?? ''),
    membershipStart: latest?.startDate ?? null,
    membershipEnd: latest?.endDate ?? null,
    amountPaid: latest?.amountPaid ?? 0,
    visits: m.appointments.length,
    memberships: m.memberships.map((mm) => ({
      id: mm.id,
      memberId: mm.memberId,
      planId: mm.planId,
      planName: mm.plan?.name ?? '',
      startDate: mm.startDate,
      endDate: mm.endDate,
      status: mm.status,
      amountPaid: mm.amountPaid,
      autoRenew: mm.autoRenew,
      createdAt: mm.createdAt.toISOString(),
    })),
    appointments: m.appointments.map((a) => ({
      id: a.id,
      memberId: a.memberId,
      serviceId: a.serviceId,
      serviceName: a.service?.name ?? '',
      staffId: a.staffId ?? null,
      staffName: a.staff?.name ?? null,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      notes: a.notes,
    })),
    payments: m.payments.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      membershipId: p.membershipId ?? null,
      appointmentId: p.appointmentId ?? null,
      description: 'Membership Payment',
      amount: p.amount,
      method: p.method,
      status: p.status,
      invoiceNo: p.invoiceNo,
      paidAt: p.paidAt.toISOString(),
    })),
  })
}
