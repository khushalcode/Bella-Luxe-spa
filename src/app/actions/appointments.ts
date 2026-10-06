'use server'

import { db } from '@/lib/db'
import type { AppointmentDTO } from '@/lib/types'

function toDTO(a: any): AppointmentDTO {
  return {
    id: a.id,
    memberId: a.memberId,
    memberName: a.member?.name,
    serviceId: a.serviceId,
    serviceName: a.service?.name,
    staffId: a.staffId ?? null,
    staffName: a.staff?.name ?? null,
    startsAt: a.startsAt,
    endsAt: a.endsAt,
    status: a.status,
    notes: a.notes ?? null,
  }
}

export async function getAppointments(): Promise<AppointmentDTO[]> {
  const rows = await db.appointment.findMany({
    include: { member: true, service: true, staff: true },
    orderBy: { startsAt: 'asc' },
  })
  return rows.map(toDTO)
}

export async function getTodaysAppointments(): Promise<AppointmentDTO[]> {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const rows = await db.appointment.findMany({
    where: { startsAt: { gte: start.toISOString(), lte: end.toISOString() } },
    include: { member: true, service: true, staff: true },
    orderBy: { startsAt: 'asc' },
  })
  return rows.map(toDTO)
}

export interface CreateAppointmentInput {
  memberId: string
  serviceId: string
  staffId?: string | null
  date: string // YYYY-MM-DD
  time: string // HH:mm
  notes?: string
}

export async function createAppointment(input: CreateAppointmentInput): Promise<AppointmentDTO> {
  const service = await db.service.findUnique({ where: { id: input.serviceId } })
  if (!service) throw new Error('Service not found')
  const start = new Date(`${input.date}T${input.time}:00`)
  const end = new Date(start.getTime() + service.durationMin * 60000)
  const a = await db.appointment.create({
    data: {
      memberId: input.memberId,
      serviceId: input.serviceId,
      staffId: input.staffId || null,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      status: 'Booked',
      notes: input.notes || null,
    },
    include: { member: true, service: true, staff: true },
  })
  return toDTO(a)
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<AppointmentDTO> {
  const a = await db.appointment.update({
    where: { id },
    data: { status },
    include: { member: true, service: true, staff: true },
  })
  return toDTO(a)
}

export async function deleteAppointment(id: string): Promise<{ ok: true }> {
  await db.appointment.delete({ where: { id } })
  return { ok: true }
}
