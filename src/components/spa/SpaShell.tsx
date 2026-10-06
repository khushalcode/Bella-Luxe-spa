'use client'

import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SpaRole } from '@/lib/supabase-server'
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
  // Auth
  userRole: SpaRole
  userEmail: string | null
  userName: string | null
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
}

const SpaContext = createContext<SpaContextValue | null>(null)

export function useSpa() {
  const ctx = useContext(SpaContext)
  if (!ctx) throw new Error('useSpa must be used within <SpaShell>')
  return ctx
}

export function SpaShell({
  initial,
  userRole = 'admin',
  userEmail = null,
  userName = null,
  children,
}: {
  initial: SpaData
  userRole?: SpaRole
  userEmail?: string | null
  userName?: string | null
  children: React.ReactNode
}) {
  const router = useRouter()
  const [view, setViewState] = useState<ViewKey>('dashboard')
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isAddMemberOpen, setAddMemberOpen] = useState(false)
  const [isBookApptOpen, setBookApptOpen] = useState(false)
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const setView = useCallback((v: ViewKey) => {
    setViewState(v)
    setMobileSidebarOpen(false)
  }, [])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const openMember = useCallback((id: string) => setSelectedMemberId(id), [])
  const closeMember = useCallback(() => setSelectedMemberId(null), [])

  const value = useMemo<SpaContextValue>(
    () => ({
      ...initial,
      view,
      setView,
      refresh,
      userRole,
      userEmail,
      userName,
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
    }),
    [
      initial,
      view,
      setView,
      refresh,
      userRole,
      userEmail,
      userName,
      isAddMemberOpen,
      isBookApptOpen,
      isCreateInvoiceOpen,
      isMobileSidebarOpen,
      selectedMemberId,
      openMember,
      closeMember,
    ]
  )

  return <SpaContext.Provider value={value}>{children}</SpaContext.Provider>
}
