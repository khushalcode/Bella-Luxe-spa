'use server'

import { db } from '@/lib/db'
import type { StaffDTO } from '@/lib/types'

function safeParseHours(s: string | null): { start: string; end: string } {
  if (!s) return { start: '09:00', end: '18:00' }
  try { return JSON.parse(s) } catch { return { start: '09:00', end: '18:00' } }
}

function formatHours(s: string | null): string {
  const h = safeParseHours(s)
  return `${h.start} – ${h.end}`
}

function toDTO(s: any): StaffDTO {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    specialization: s.specialization ?? null,
    commissionPct: s.commissionPct,
    perDaySalary: s.perDaySalary ?? 0,
    workingHours: formatHours(s.workingHours),
    avatarUrl: s.avatarUrl ?? null,
    isActive: s.isActive,
  }
}

export async function getStaff(): Promise<StaffDTO[]> {
  const rows = await db.staff.findMany({ orderBy: { name: 'asc' } })
  return rows.map(toDTO)
}

export interface CreateStaffInput {
  name: string
  role: string
  specialization?: string
  commissionPct?: number
  perDaySalary?: number
  startHour?: string
  endHour?: string
  isActive?: boolean
}

export async function createStaff(input: CreateStaffInput): Promise<StaffDTO> {
  const s = await db.staff.create({
    data: {
      name: input.name,
      role: input.role,
      specialization: input.specialization || null,
      commissionPct: input.commissionPct ?? 0,
      perDaySalary: input.perDaySalary ?? 0,
      workingHours: JSON.stringify({
        start: input.startHour ?? '09:00',
        end: input.endHour ?? '18:00',
      }),
      isActive: input.isActive ?? true,
    },
  })
  return toDTO(s)
}

export interface UpdateStaffInput {
  name?: string
  role?: string
  specialization?: string | null
  commissionPct?: number
  perDaySalary?: number
  startHour?: string
  endHour?: string
  isActive?: boolean
}

export async function updateStaff(id: string, patch: UpdateStaffInput): Promise<StaffDTO> {
  const data: Record<string, unknown> = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.role !== undefined) data.role = patch.role
  if (patch.specialization !== undefined) data.specialization = patch.specialization
  if (patch.commissionPct !== undefined) data.commissionPct = patch.commissionPct
  if (patch.perDaySalary !== undefined) data.perDaySalary = patch.perDaySalary
  if (patch.isActive !== undefined) data.isActive = patch.isActive
  if (patch.startHour !== undefined || patch.endHour !== undefined) {
    const existing = await db.staff.findUnique({ where: { id } })
    const current = safeParseHours(existing?.workingHours ?? null)
    data.workingHours = JSON.stringify({
      start: patch.startHour ?? current.start,
      end: patch.endHour ?? current.end,
    })
  }
  const s = await db.staff.update({ where: { id }, data })
  return toDTO(s)
}

export async function toggleStaff(id: string): Promise<{ ok: true; isActive: boolean }> {
  const s = await db.staff.findUnique({ where: { id } })
  if (!s) throw new Error('Staff not found')
  const updated = await db.staff.update({
    where: { id },
    data: { isActive: !s.isActive },
  })
  return { ok: true, isActive: updated.isActive }
}

export async function deleteStaff(id: string): Promise<{ ok: true }> {
  await db.staff.delete({ where: { id } })
  return { ok: true }
}
