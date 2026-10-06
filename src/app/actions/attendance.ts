'use server'

import { db } from '@/lib/db'
import type { StaffAttendanceDTO, StaffSalaryRow } from '@/lib/types'
import { monthLabel } from '@/lib/dates'

const RETENTION_DAYS = 60 // keep only last ~2 months of attendance

function currentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function toDTO(a: any): StaffAttendanceDTO {
  return {
    id: a.id,
    staffId: a.staffId,
    staffName: a.staff?.name ?? undefined,
    date: a.date,
    status: a.status as StaffAttendanceDTO['status'],
    checkIn: a.checkIn ?? null,
    checkOut: a.checkOut ?? null,
    notes: a.notes ?? null,
    createdAt: a.createdAt?.toISOString?.() ?? String(a.createdAt),
  }
}

/** Removes attendance records older than RETENTION_DAYS. Called automatically. */
export async function cleanupOldAttendance(): Promise<{ deleted: number }> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const result = await db.staffAttendance.deleteMany({
    where: { date: { lt: cutoffStr } },
  })
  return { deleted: result.count }
}

/** Returns attendance for a given month (defaults to current month). */
export async function getMonthlyAttendance(yearMonth?: string): Promise<StaffAttendanceDTO[]> {
  await cleanupOldAttendance()
  const ym = yearMonth ?? currentYearMonth()
  const [y, m] = ym.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const rows = await db.staffAttendance.findMany({
    where: {
      date: {
        gte: start.toISOString().slice(0, 10),
        lte: end.toISOString().slice(0, 10),
      },
    },
    include: { staff: true },
    orderBy: [{ date: 'asc' }, { staff: { name: 'asc' } }],
  })
  return rows.map(toDTO)
}

/** Returns attendance for a specific date (defaults to today). */
export async function getAttendanceForDate(date?: string): Promise<StaffAttendanceDTO[]> {
  await cleanupOldAttendance()
  const d = date ?? new Date().toISOString().slice(0, 10)
  const rows = await db.staffAttendance.findMany({
    where: { date: d },
    include: { staff: true },
    orderBy: { staff: { name: 'asc' } },
  })
  return rows.map(toDTO)
}

export interface MarkAttendanceInput {
  staffId: string
  date: string
  status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday'
  checkIn?: string | null
  checkOut?: string | null
  notes?: string | null
}

/** Upserts a single staff-day attendance record. */
export async function markAttendance(input: MarkAttendanceInput): Promise<StaffAttendanceDTO> {
  const a = await db.staffAttendance.upsert({
    where: {
      staffId_date: { staffId: input.staffId, date: input.date },
    },
    create: {
      staffId: input.staffId,
      date: input.date,
      status: input.status,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      notes: input.notes ?? null,
    },
    update: {
      status: input.status,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      notes: input.notes ?? null,
    },
    include: { staff: true },
  })
  return toDTO(a)
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
  for (const r of records) {
    await db.staffAttendance.upsert({
      where: { staffId_date: { staffId: r.staffId, date } },
      create: {
        staffId: r.staffId,
        date,
        status: r.status,
        checkIn: r.checkIn ?? null,
        checkOut: r.checkOut ?? null,
        notes: r.notes ?? null,
      },
      update: {
        status: r.status,
        checkIn: r.checkIn ?? null,
        checkOut: r.checkOut ?? null,
        notes: r.notes ?? null,
      },
    })
  }
  return { ok: true, count: records.length }
}

export async function deleteAttendance(id: string): Promise<{ ok: true }> {
  await db.staffAttendance.delete({ where: { id } })
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
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const staffList = await db.staff.findMany({ orderBy: { name: 'asc' } })
  const records = await db.staffAttendance.findMany({
    where: {
      date: {
        gte: start.toISOString().slice(0, 10),
        lte: end.toISOString().slice(0, 10),
      },
    },
  })

  const byStaff = new Map<string, { Present: number; 'Half-Day': number; Absent: number; Leave: number; Holiday: number }>()
  for (const r of records) {
    const cur = byStaff.get(r.staffId) ?? { Present: 0, 'Half-Day': 0, Absent: 0, Leave: 0, Holiday: 0 }
    if (cur[r.status as keyof typeof cur] !== undefined) {
      cur[r.status as keyof typeof cur] += 1
    }
    byStaff.set(r.staffId, cur)
  }

  return staffList.map((s) => {
    const counts = byStaff.get(s.id) ?? { Present: 0, 'Half-Day': 0, Absent: 0, Leave: 0, Holiday: 0 }
    const perDay = s.perDaySalary ?? 0
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
  const rows = await db.staffAttendance.findMany({ select: { date: true } })
  const byMonth = new Map<string, number>()
  for (const r of rows) {
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
  const rows = await db.staffAttendance.findMany({ where: { date: today } })
  return {
    present: rows.filter((r) => r.status === 'Present').length,
    absent: rows.filter((r) => r.status === 'Absent').length,
    halfDay: rows.filter((r) => r.status === 'Half-Day').length,
    leave: rows.filter((r) => r.status === 'Leave').length,
    holiday: rows.filter((r) => r.status === 'Holiday').length,
  }
}
