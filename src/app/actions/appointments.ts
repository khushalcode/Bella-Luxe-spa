'use server'

import { getSupabase } from '@/lib/supabaseServer'
import type { AppointmentDTO } from '@/lib/types'

interface AppointmentRow {
  id: string
  member_id: string
  service_id: string
  staff_id: string | null
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
}

interface MemberRef { id: string; name: string }
interface ServiceRef { id: string; name: string }
interface StaffRef { id: string; name: string }

function toDTO(a: AppointmentRow, member?: MemberRef, service?: ServiceRef, staff?: StaffRef | null): AppointmentDTO {
  return {
    id: a.id,
    memberId: a.member_id,
    memberName: member?.name,
    serviceId: a.service_id,
    serviceName: service?.name,
    staffId: a.staff_id ?? null,
    staffName: staff?.name ?? null,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    status: a.status,
    notes: a.notes ?? null,
  }
}

export async function getAppointments(): Promise<AppointmentDTO[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('appointments')
    .select(`
      *,
      member:members(id, name),
      service:services(id, name),
      staff:staff(id, name)
    `)
    .order('starts_at', { ascending: true })
  if (error) throw new Error(`Failed to load appointments: ${error.message}`)
  return (data as any[]).map((row) =>
    toDTO(row as AppointmentRow, row.member, row.service, row.staff)
  )
}

export async function getTodaysAppointments(): Promise<AppointmentDTO[]> {
  const sb = await getSupabase()
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const { data, error } = await sb
    .from('appointments')
    .select(`
      *,
      member:members(id, name),
      service:services(id, name),
      staff:staff(id, name)
    `)
    .gte('starts_at', start.toISOString())
    .lte('starts_at', end.toISOString())
    .order('starts_at', { ascending: true })
  if (error) throw new Error(`Failed to load today's appointments: ${error.message}`)
  return (data as any[]).map((row) =>
    toDTO(row as AppointmentRow, row.member, row.service, row.staff)
  )
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
  const sb = await getSupabase()
  const { data: service, error: sErr } = await sb
    .from('services')
    .select('duration_min')
    .eq('id', input.serviceId)
    .single()
  if (sErr || !service) throw new Error('Service not found')
  const start = new Date(`${input.date}T${input.time}:00`)
  const end = new Date(start.getTime() + (service as any).duration_min * 60000)
  const { data, error } = await sb
    .from('appointments')
    .insert({
      member_id: input.memberId,
      service_id: input.serviceId,
      staff_id: input.staffId || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'Booked',
      notes: input.notes || null,
    })
    .select(`
      *,
      member:members(id, name),
      service:services(id, name),
      staff:staff(id, name)
    `)
    .single()
  if (error) throw new Error(`Failed to create appointment: ${error.message}`)
  return toDTO(data as AppointmentRow, (data as any).member, (data as any).service, (data as any).staff)
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<AppointmentDTO> {
  const { data, error } = await sb
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      member:members(id, name),
      service:services(id, name),
      staff:staff(id, name)
    `)
    .single()
  if (error) throw new Error(`Failed to update appointment: ${error.message}`)
  return toDTO(data as AppointmentRow, (data as any).member, (data as any).service, (data as any).staff)
}

export async function deleteAppointment(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb.from('appointments').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
  return { ok: true }
}
