'use server'

import { supabase, toISO } from '@/lib/supabaseServer'
import type { StaffAttendanceDTO, StaffSalaryRow } from '@/lib/types'
import { monthLabel } from '@/lib/dates'

const RETENTION_DAYS = 60 // keep only last ~2 months of attendance

function currentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface AttendanceRow {
  id: string
  staff_id: string
  date: string
  status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday'
  check_in: string | null
  check_out: string | null
  notes: string | null
  created_at: string
  staff?: { id: string; name: string } | null
}

function toDTO(a: AttendanceRow): StaffAttendanceDTO {
  return {
    id: a.id,
    staffId: a.staff_id,
    staffName: a.staff?.name ?? undefined,
    date: a.date,
    status: a.status,
    checkIn: a.check_in ?? null,
    checkOut: a.check_out ?? null,
    notes: a.notes ?? null,
    createdAt: toISO(a.created_at),
  }
}

/** Removes attendance records older than RETENTION_DAYS. Called automatically. */
export async function cleanupOldAttendance(): Promise<{ deleted: number }> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('staff_attendance')
    .delete()
    .lt('date', cutoffStr)
    .select('id')
  if (error) throw new Error(`Failed to archive old attendance: ${error.message}`)
  return { deleted: (data ?? []).length }
}

/** Returns attendance for a given month (defaults to current month). */
export async function getMonthlyAttendance(yearMonth?: string): Promise<StaffAttendanceDTO[]> {
  await cleanupOldAttendance()
  const ym = yearMonth ?? currentYearMonth()
  const [y, m] = ym.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, 1).toISOString().slice(0, 10)
  const end = new Date(y, m, 0).toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('staff_attendance')
    .select(`
      *,
      staff:staff(id, name)
    `)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
    .order('staff_id', { ascending: true })
  if (error) throw new Error(`Failed to load monthly attendance: ${error.message}`)
  return ((data ?? []) as AttendanceRow[]).map(toDTO)
}

/** Returns attendance for a specific date (defaults to today). */
export async function getAttendanceForDate(date?: string): Promise<StaffAttendanceDTO[]> {
  await cleanupOldAttendance()
  const d = date ?? new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('staff_attendance')
    .select(`
      *,
      staff:staff(id, name)
    `)
    .eq('date', d)
    .order('staff_id', { ascending: true })
  if (error) throw new Error(`Failed to load attendance for date: ${error.message}`)
  return ((data ?? []) as AttendanceRow[]).map(toDTO)
}

export interface MarkAttendanceInput {
  staffId: string
  date: string
  status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday'
  checkIn?: string | null
  checkOut?: string | null
  notes?: string | null
}

/** Upserts a single staff-day attendance record (using the unique (staff_id, date) constraint). */
export async function markAttendance(input: MarkAttendanceInput): Promise<StaffAttendanceDTO> {
  const payload = {
    staff_id: input.staffId,
    date: input.date,
    status: input.status,
    check_in: input.checkIn ?? null,
    check_out: input.checkOut ?? null,
    notes: input.notes ?? null,
  }

  // Try insert; on conflict (staff_id, date), do update
  const { data, error } = await supabase
    .from('staff_attendance')
    .upsert(payload, { onConflict: 'staff_id,date' })
    .select(`
      *,
      staff:staff(id, name)
    `)
    .single()
  if (error) throw new Error(`Failed to mark attendance: ${error.message}`)
  return toDTO(data as AttendanceRow)
}

/** Bulk-marks attendance for many staff for a single date. */
export async function bulkMarkAttendance(
  date: string,
  records: Array<{
    staffId: string
    status: MarkAttendanceInput['status']
    checkIn?: string | null
    checkOut?: string | null
    notes?: string | null
  }>
): Promise<{ ok: true; count: number }> {
  const rows = records.map((r) => ({
    staff_id: r.staffId,
    date,
    status: r.status,
    check_in: r.checkIn ?? null,
    check_out: r.checkOut ?? null,
    notes: r.notes ?? null,
  }))
  const { error } = await supabase
    .from('staff_attendance')
    .upsert(rows, { onConflict: 'staff_id,date' })
  if (error) throw new Error(`Failed to bulk-mark attendance: ${error.message}`)
  return { ok: true, count: records.length }
}

export async function deleteAttendance(id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from('staff_attendance').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete attendance: ${error.message}`)
  return { ok: true }
}

/**
 * Computes monthly salary for each staff based on per-day salary.
 *  Present   -> full perDaySalary
 *  Half-Day  -> 0.5 × perDaySalary
 *  Absent    -> 0 (informational deduction = perDaySalary)
 *  Leave     -> 0 (unpaid)
 *  Holiday   -> 0 (not counted as working day)
 */
export async function getMonthlySalary(yearMonth?: string): Promise<StaffSalaryRow[]> {
  const ym = yearMonth ?? currentYearMonth()
  const [y, m] = ym.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, 1).toISOString().slice(0, 10)
  const end = new Date(y, m, 0).toISOString().slice(0, 10)

  const { data: staffList, error: sErr } = await supabase
    .from('staff')
    .select('*')
    .order('name', { ascending: true })
  if (sErr) throw new Error(`Failed to load staff: ${sErr.message}`)

  const { data: records, error: aErr } = await supabase
    .from('staff_attendance')
    .select('staff_id, status')
    .gte('date', start)
    .lte('date', end)
  if (aErr) throw new Error(`Failed to load attendance: ${aErr.message}`)

  const byStaff = new Map<string, { Present: number; 'Half-Day': number; Absent: number; Leave: number; Holiday: number }>()
  for (const r of (records ?? []) as { staff_id: string; status: string }[]) {
    const cur = byStaff.get(r.staff_id) ?? { Present: 0, 'Half-Day': 0, Absent: 0, Leave: 0, Holiday: 0 }
    if (cur[r.status as keyof typeof cur] !== undefined) {
      cur[r.status as keyof typeof cur] += 1
    }
    byStaff.set(r.staff_id, cur)
  }

  return (staffList as any[]).map((s) => {
    const counts = byStaff.get(s.id) ?? { Present: 0, 'Half-Day': 0, Absent: 0, Leave: 0, Holiday: 0 }
    const perDay = s.per_day_salary ?? 0
    const computedSalary = counts.Present * perDay + counts['Half-Day'] * perDay * 0.5
    const deductions = counts.Absent * perDay
    const totalDays = counts.Present + counts['Half-Day'] + counts.Absent + counts.Leave + counts.Holiday
    return {
      staffId: s.id,
      staffName: s.name,
      role: s.role,
      perDaySalary: perDay,
      presentDays: counts.Present,
      halfDays: counts['Half-Day'],
      absentDays: counts.Absent,
      leaveDays: counts.Leave,
      holidayDays: counts.Holiday,
      totalDays,
      computedSalary,
      deductions,
      monthLabel: monthLabel(ym),
      yearMonth: ym,
    }
  })
}

/** Returns the available months that have attendance data (for the date/month-wise report selector). */
export async function getAvailableMonths(): Promise<{ yearMonth: string; label: string; count: number }[]> {
  await cleanupOldAttendance()
  const { data, error } = await supabase.from('staff_attendance').select('date')
  if (error) throw new Error(`Failed to load attendance months: ${error.message}`)
  const byMonth = new Map<string, number>()
  for (const r of (data ?? []) as { date: string }[]) {
    const ym = r.date.slice(0, 7)
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + 1)
  }
  return Array.from(byMonth.entries())
    .map(([yearMonth, count]) => ({
      yearMonth,
      label: monthLabel(yearMonth),
      count,
    }))
    .sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : -1))
}

/** Returns today's attendance summary (for dashboard KPI). */
export async function getTodayAttendanceSummary(): Promise<{
  present: number
  absent: number
  halfDay: number
  leave: number
  holiday: number
}> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('status')
    .eq('date', today)
  if (error) throw new Error(`Failed to load today's attendance: ${error.message}`)
  const rows = (data ?? []) as { status: string }[]
  return {
    present: rows.filter((r) => r.status === 'Present').length,
    absent: rows.filter((r) => r.status === 'Absent').length,
    halfDay: rows.filter((r) => r.status === 'Half-Day').length,
    leave: rows.filter((r) => r.status === 'Leave').length,
    holiday: rows.filter((r) => r.status === 'Holiday').length,
  }
}
