'use server'

import { getSupabase, toISO } from '@/lib/supabaseServer'
import type { DailyEntryDTO, MonthlyReportMeta } from '@/lib/types'
import {
  monthLabel,
  previousYearMonth,
  yearMonthOf,
} from '@/lib/dates'

interface DailyEntryRow {
  id: string
  entry_date: string
  member_code: string | null
  member_name: string
  phone: string | null
  service_name: string
  therapist_name: string | null
  amount: number
  payment_mode: string
  notes: string | null
  created_at: string
}

function toDTO(e: DailyEntryRow): DailyEntryDTO {
  return {
    id: e.id,
    entryDate: e.entry_date,
    memberCode: e.member_code ?? null,
    memberName: e.member_name,
    phone: e.phone ?? null,
    serviceName: e.service_name,
    therapistName: e.therapist_name ?? null,
    amount: e.amount,
    paymentMode: e.payment_mode,
    notes: e.notes ?? null,
    createdAt: toISO(e.created_at),
  }
}

/** Returns all daily entries, optionally filtered by date or month. */
export async function getDailyEntries(opts?: {
  date?: string         // YYYY-MM-DD
  yearMonth?: string    // YYYY-MM
}): Promise<DailyEntryDTO[]> {
  const sb = await getSupabase()
  let q = sb.from('daily_entries').select('*')
  if (opts?.date) {
    q = q.eq('entry_date', opts.date)
  } else if (opts?.yearMonth) {
    const [y, m] = opts.yearMonth.split('-').map((n) => parseInt(n, 10))
    const start = new Date(y, m - 1, 1).toISOString().slice(0, 10)
    const end = new Date(y, m, 0).toISOString().slice(0, 10)
    q = q.gte('entry_date', start).lte('entry_date', end)
  }
  q = q.order('entry_date', { ascending: false }).order('created_at', { ascending: false })
  const { data, error } = await q
  if (error) throw new Error(`Failed to load daily entries: ${error.message}`)
  return (data as DailyEntryRow[]).map(toDTO)
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
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('daily_entries')
    .insert({
      entry_date: input.entryDate,
      member_code: input.memberCode ?? null,
      member_name: input.memberName,
      phone: input.phone ?? null,
      service_name: input.serviceName,
      therapist_name: input.therapistName ?? null,
      amount: input.amount ?? 0,
      payment_mode: input.paymentMode ?? 'Cash',
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create daily entry: ${error.message}`)
  return toDTO(data as DailyEntryRow)
}

export async function updateDailyEntry(
  id: string,
  patch: Partial<CreateDailyEntryInput>
): Promise<DailyEntryDTO> {
  const update: Record<string, any> = {}
  if (patch.entryDate !== undefined) update.entry_date = patch.entryDate
  if (patch.memberCode !== undefined) update.member_code = patch.memberCode
  if (patch.memberName !== undefined) update.member_name = patch.memberName
  if (patch.phone !== undefined) update.phone = patch.phone
  if (patch.serviceName !== undefined) update.service_name = patch.serviceName
  if (patch.therapistName !== undefined) update.therapist_name = patch.therapistName
  if (patch.amount !== undefined) update.amount = patch.amount
  if (patch.paymentMode !== undefined) update.payment_mode = patch.paymentMode
  if (patch.notes !== undefined) update.notes = patch.notes

  const { data, error } = await sb
    .from('daily_entries')
    .update(update)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(`Failed to update daily entry: ${error.message}`)
  return toDTO(data as DailyEntryRow)
}

export async function deleteDailyEntry(id: string): Promise<{ ok: true }> {
  const sb = await getSupabase()
  const { error } = await sb.from('daily_entries').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete daily entry: ${error.message}`)
  return { ok: true }
}

/** Returns a list of available monthly reports (months with at least one entry). */
export async function getMonthlyReports(): Promise<MonthlyReportMeta[]> {
  const sb = await getSupabase()
  const { data, error } = await sb
    .from('daily_entries')
    .select('entry_date, amount')
  if (error) throw new Error(`Failed to load monthly reports: ${error.message}`)
  const byMonth = new Map<string, { count: number; revenue: number }>()
  for (const r of (data ?? []) as { entry_date: string; amount: number }[]) {
    const ym = yearMonthOf(r.entry_date)
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
  const sb = await getSupabase()
  const [y, m] = yearMonth.split('-').map((n) => parseInt(n, 10))
  const start = new Date(y, m - 1, 1).toISOString().slice(0, 10)
  const end = new Date(y, m, 0).toISOString().slice(0, 10)
  const { data, error } = await sb
    .from('daily_entries')
    .select('*')
    .gte('entry_date', start)
    .lte('entry_date', end)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Failed to load monthly entries: ${error.message}`)
  const entries = ((data ?? []) as DailyEntryRow[]).map(toDTO)
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
  const sb = await getSupabase()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await sb
    .from('daily_entries')
    .select('*')
    .eq('entry_date', today)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load today's entries: ${error.message}`)
  const entries = ((data ?? []) as DailyEntryRow[]).map(toDTO)
  return {
    entries,
    count: entries.length,
    revenue: entries.reduce((s, e) => s + e.amount, 0),
  }
}

/** Returns the meta for the previous month (for the "ready to download" dashboard banner). */
export async function getPreviousMonthReportMeta(): Promise<MonthlyReportMeta | null> {
  const sb = await getSupabase()
  const ym = previousYearMonth()
  const reports = await getMonthlyReports()
  return reports.find((r) => r.yearMonth === ym) ?? null
}
