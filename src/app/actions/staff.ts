'use server'

import { supabase } from '@/lib/supabaseServer'
import type { StaffDTO } from '@/lib/types'

interface StaffRow {
  id: string
  name: string
  role: string
  specialization: string | null
  commission_pct: number
  per_day_salary: number
  working_hours: any
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

function safeParseHours(s: any): { start: string; end: string } {
  if (!s) return { start: '09:00', end: '18:00' }
  if (typeof s === 'object' && s.start && s.end) return { start: s.start, end: s.end }
  try { return JSON.parse(s) } catch { return { start: '09:00', end: '18:00' } }
}

function formatHours(s: any): string {
  const h = safeParseHours(s)
  return `${h.start} – ${h.end}`
}

function toDTO(s: StaffRow): StaffDTO {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    specialization: s.specialization ?? null,
    commissionPct: s.commission_pct,
    perDaySalary: s.per_day_salary ?? 0,
    workingHours: formatHours(s.working_hours),
    avatarUrl: s.avatar_url ?? null,
    isActive: s.is_active,
  }
}

export async function getStaff(): Promise<StaffDTO[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(`Failed to load staff: ${error.message}`)
  return (data as StaffRow[]).map(toDTO)
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
  const workingHours = {
    start: input.startHour ?? '09:00',
    end: input.endHour ?? '18:00',
  }
  const { data, error } = await supabase
    .from('staff')
    .insert({
      name: input.name,
      role: input.role,
      specialization: input.specialization || null,
      commission_pct: input.commissionPct ?? 0,
      per_day_salary: input.perDaySalary ?? 0,
      working_hours: workingHours,
      is_active: input.isActive ?? true,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create staff: ${error.message}`)
  return toDTO(data as StaffRow)
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
  const update: Record<string, any> = {}
  if (patch.name !== undefined) update.name = patch.name
  if (patch.role !== undefined) update.role = patch.role
  if (patch.specialization !== undefined) update.specialization = patch.specialization
  if (patch.commissionPct !== undefined) update.commission_pct = patch.commissionPct
  if (patch.perDaySalary !== undefined) update.per_day_salary = patch.perDaySalary
  if (patch.isActive !== undefined) update.is_active = patch.isActive
  if (patch.startHour !== undefined || patch.endHour !== undefined) {
    const { data: existing } = await supabase
      .from('staff')
      .select('working_hours')
      .eq('id', id)
      .single()
    const current = safeParseHours((existing as any)?.working_hours ?? null)
    update.working_hours = {
      start: patch.startHour ?? current.start,
      end: patch.endHour ?? current.end,
    }
  }

  const { data, error } = await supabase
    .from('staff')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update staff: ${error.message}`)
  return toDTO(data as StaffRow)
}

export async function toggleStaff(id: string): Promise<{ ok: true; isActive: boolean }> {
  const { data: cur, error: e1 } = await supabase
    .from('staff')
    .select('is_active')
    .eq('id', id)
    .single()
  if (e1 || !cur) throw new Error('Staff not found')
  const next = !(cur as any).is_active
  const { error: e2 } = await supabase
    .from('staff')
    .update({ is_active: next })
    .eq('id', id)
  if (e2) throw new Error(`Failed to toggle staff: ${e2.message}`)
  return { ok: true, isActive: next }
}

export async function deleteStaff(id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from('staff').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete staff: ${error.message}`)
  return { ok: true }
}
