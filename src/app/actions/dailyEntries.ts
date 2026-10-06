'use server'

import { db } from '@/lib/db'
import type { DailyEntryDTO, MonthlyReportMeta } from '@/lib/types'
import {
  monthLabel,
  previousYearMonth,
  yearMonthOf,
} from '@/lib/dates'

function toDTO(e: any): DailyEntryDTO {
  return {
    id: e.id,
    entryDate: e.entryDate,
    memberCode: e.memberCode ?? null,
    memberName: e.memberName,
    phone: e.phone ?? null,
    serviceName: e.serviceName,
    therapistName: e.therapistName ?? null,
    amount: e.amount,
    paymentMode: e.paymentMode,
    notes: e.notes ?? null,
    createdAt: e.createdAt?.toISOString?.() ?? String(e.createdAt),
  }
}

/** Returns all daily entries, optionally filtered by date or month. */
export async function getDailyEntries(opts?: {
  date?: string         // YYYY-MM-DD
  yearMonth?: string    // YYYY-MM
}): Promise<DailyEntryDTO[]> {
  const where: { entryDate?: { gte?: string; lte?: string; equals?: string } } = {}
  if (opts?.date) {
    where.entryDate = { equals: opts.date }
  } else if (opts?.yearMonth) {
    const [y, m] = opts.yearMonth.split('-').map((n) => parseInt(n, 10))
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)
    where.entryDate = {
      gte: start.toISOString().slice(0, 10),
      lte: end.toISOString().slice(0, 10),
    }
  }
  const rows = await db.dailyEntry.findMany({
    where,
    orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.map(toDTO)
}

export interface CreateDailyEntryInput {
  entryDate: string
  memberCode?: string | null
  memberName: string
  phone?: string | null
  serviceName: string
  therapistName?: string | null
  amount: number
  paymentMode: string
  notes?: string | null
}

export async function createDailyEntry(input: CreateDailyEntryInput): Promise<DailyEntryDTO> {
  const e = await db.dailyEntry.create({
    data: {
      entryDate: input.entryDate,
      memberCode: input.memberCode ?? null,
      memberName: input.memberName,
      phone: input.phone ?? null,
      serviceName: input.serviceName,
      therapistName: input.therapistName ?? null,
      amount: input.amount ?? 0,
      paymentMode: input.paymentMode ?? 'Cash',
      notes: input.notes ?? null,
    },
  })
  return toDTO(e)
}

export async function updateDailyEntry(
  id: string,
  patch: Partial<CreateDailyEntryInput>
): Promise<DailyEntryDTO> {
  const e = await db.dailyEntry.update({ where: { id }, data: patch })
  return toDTO(e)
}

export async function deleteDailyEntry(id: string): Promise<{ ok: true }> {
  await db.dailyEntry.delete({ where: { id } })
  return { ok: true }
}

/** Returns a list of available monthly reports (months with at least one entry). */
export async function getMonthlyReports(): Promise<MonthlyReportMeta[]> {
  const rows = await db.dailyEntry.findMany({
    select: { entryDate: true, amount: true },
  })
  const byMonth = new Map<string, { count: number; revenue: number }>()
  for (const r of rows) {
    const ym = yearMonthOf(r.entryDate)
    const cur = byMonth.get(ym) ?? { count: 0, revenue: 0 }
    cur.count += 1
    cur.revenue += r.amount
    byMonth.set(ym, cur)
  }
  return Array.from(byMonth.entries())
    .map(([yearMonth, v]) => ({
      yearMonth,
      label: monthLabel(yearMonth),
      entryCount: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : -1))
}

/** Returns the entries for a specific month, plus a totals row. */
export async function getMonthlyEntries(yearMonth: string): Promise<{
  entries: DailyEntryDTO[]
  total: number
  count: number
  label: string
}> {
  const [y, m] = yearMonth.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const rows = await db.dailyEntry.findMany({
    where: {
      entryDate: {
        gte: start.toISOString().slice(0, 10),
        lte: end.toISOString().slice(0, 10),
      },
    },
    orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
  })
  const entries = rows.map(toDTO)
  return {
    entries,
    total: entries.reduce((s, e) => s + e.amount, 0),
    count: entries.length,
    label: monthLabel(yearMonth),
  }
}

/** Returns today's entries and revenue (for dashboard). */
export async function getTodayEntriesSummary(): Promise<{
  entries: DailyEntryDTO[]
  count: number
  revenue: number
}> {
  const today = new Date().toISOString().slice(0, 10)
  const rows = await db.dailyEntry.findMany({
    where: { entryDate: today },
    orderBy: { createdAt: 'desc' },
  })
  const entries = rows.map(toDTO)
  return {
    entries,
    count: entries.length,
    revenue: entries.reduce((s, e) => s + e.amount, 0),
  }
}

/** Returns the meta for the previous month (for the "ready to download" dashboard banner). */
export async function getPreviousMonthReportMeta(): Promise<MonthlyReportMeta | null> {
  const ym = previousYearMonth()
  const reports = await getMonthlyReports()
  return reports.find((r) => r.yearMonth === ym) ?? null
}
