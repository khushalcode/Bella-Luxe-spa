'use client'

import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  MemberDTO,
  PlanDTO,
  ServiceDTO,
  StaffDTO,
  AppointmentDTO,
  PaymentDTO,
  PackageDTO,
  CampaignDTO,
  DashboardSummary,
  RevenuePoint,
  MemberGrowthPoint,
  PlanPerformancePoint,
  RetentionPoint,
  DailyEntryDTO,
  MonthlyReportMeta,
  StaffAttendanceDTO,
  StaffSalaryRow,
} from '@/lib/types'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'

export type ViewKey =
  | 'dashboard'
  | 'daily-entries'
  | 'members'
  | 'plans'
  | 'appointments'
  | 'services'
  | 'payments'
  | 'packages'
  | 'staff'
  | 'attendance'
  | 'salary'
  | 'reports'
  | 'marketing'
  | 'settings'

export interface SpaData {
  summary: DashboardSummary
  members: MemberDTO[]
  plans: PlanDTO[]
  services: ServiceDTO[]
  staff: StaffDTO[]
  appointments: AppointmentDTO[]
  payments: PaymentDTO[]
  packages: PackageDTO[]
  campaigns: CampaignDTO[]
  revenueReport: RevenuePoint[]
  memberGrowth: MemberGrowthPoint[]
  planPerformance: PlanPerformancePoint[]
  retention: RetentionPoint[]
  dailyEntries: DailyEntryDTO[]
  monthlyReports: MonthlyReportMeta[]
  attendance: StaffAttendanceDTO[]
  salaryRows: StaffSalaryRow[]
  attendanceMonths: { yearMonth: string; label: string; count: number }[]
}

interface SpaContextValue extends SpaData {
  view: ViewKey
  setView: (v: ViewKey) => void
  refresh: () => void
  /**
   * Optimistically update local data without waiting for server re-fetch.
   * Use this AFTER a server action completes to instantly reflect the change
   * in the UI. The background router.refresh() will reconcile shortly after.
   *
   * Example: mergeData({ dailyEntries: [newEntry, ...dailyEntries] })
   */
  mergeData: (partial: Partial<SpaData>) => void
  // UI state for global dialogs/sheets
  isAddMemberOpen: boolean
  setAddMemberOpen: (b: boolean) => void
  isBookApptOpen: boolean
  setBookApptOpen: (b: boolean) => void
  isCreateInvoiceOpen: boolean
  setCreateInvoiceOpen: (b: boolean) => void
  isMobileSidebarOpen: boolean
  setMobileSidebarOpen: (b: boolean) => void
  // Member profile sheet (right-side)
  selectedMemberId: string | null
  openMember: (id: string) => void
  closeMember: () => void
  // Realtime sync status
  realtime: { status: 'live' | 'polling' | 'off'; lastSync: number }
}

const SpaContext = createContext<SpaContextValue | null>(null)

export function useSpa() {
  const ctx = useContext(SpaContext)
  if (!ctx) throw new Error('useSpa must be used within <SpaShell>')
  return ctx
}

export function SpaShell({
  initial,
  children,
}: {
  initial: SpaData
  children: React.ReactNode
}) {
  const router = useRouter()
  const [view, setViewState] = useState<ViewKey>('dashboard')
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isAddMemberOpen, setAddMemberOpen] = useState(false)
  const [isBookApptOpen, setBookApptOpen] = useState(false)
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // Local data state — starts with `initial` from server, but can be optimistically
  // updated via `mergeData` for instant UI feedback. When `router.refresh()` fires
  // (every 1s via polling, or after a form submit), the server passes new `initial`
  // props, and we sync the local state to match.
  //
  // We use the "derived state from props" pattern (setState during render) —
  // this is the React-recommended approach for syncing state to props without
  // causing cascading renders. See: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevInitial, setPrevInitial] = useState<SpaData>(initial)
  const [localData, setLocalData] = useState<SpaData>(initial)
  if (prevInitial !== initial) {
    setPrevInitial(initial)
    setLocalData(initial)
  }

  // Realtime sync — 1-second polling + Supabase Realtime subscriptions.
  const realtime = useRealtimeSync()

  const setView = useCallback((v: ViewKey) => {
    setViewState(v)
    setMobileSidebarOpen(false)
  }, [])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  /**
   * Optimistically merge new data into the local state. Called by forms right
   * after a server action completes. The UI updates INSTANTLY without waiting
   * for router.refresh() to re-fetch all 18 server actions (which takes 2-3s
   * in dev mode). The background router.refresh() will reconcile shortly.
   */
  const mergeData = useCallback((partial: Partial<SpaData>) => {
    setLocalData((prev) => ({ ...prev, ...partial }))
  }, [])

  const openMember = useCallback((id: string) => setSelectedMemberId(id), [])
  const closeMember = useCallback(() => setSelectedMemberId(null), [])

  const value = useMemo<SpaContextValue>(
    () => ({
      ...localData,
      view,
      setView,
      refresh,
      mergeData,
      isAddMemberOpen,
      setAddMemberOpen,
      isBookApptOpen,
      setBookApptOpen,
      isCreateInvoiceOpen,
      setCreateInvoiceOpen,
      isMobileSidebarOpen,
      setMobileSidebarOpen,
      selectedMemberId,
      openMember,
      closeMember,
      realtime,
    }),
    [
      localData,
      view,
      setView,
      refresh,
      mergeData,
      isAddMemberOpen,
      isBookApptOpen,
      isCreateInvoiceOpen,
      isMobileSidebarOpen,
      selectedMemberId,
      openMember,
      closeMember,
      realtime,
    ]
  )

  return <SpaContext.Provider value={value}>{children}</SpaContext.Provider>
}
