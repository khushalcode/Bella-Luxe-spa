// Plain serializable types shared between server actions and client
// (no Date instances — server actions return ISO strings or numbers).

export interface MemberDTO {
  id: string
  memberCode: string
  name: string
  phone: string
  email: string | null
  gender: string
  dob: string | null
  address: string | null
  notes: string | null
  createdAt: string
  // Aggregated / joined
  currentPlanName?: string | null
  currentPlanId?: string | null
  membershipStatus?: 'Active' | 'Expiring Soon' | 'Expired' | null
  membershipStart?: string | null
  membershipEnd?: string | null
  amountPaid?: number
  visits?: number
}

export interface PlanDTO {
  id: string
  name: string
  price: number
  durationDays: number
  sessionsIncluded: number
  discountPct: number
  benefits: string[]
  isActive: boolean
  memberCount?: number
  revenue?: number
}

export interface MembershipDTO {
  id: string
  memberId: string
  planId: string
  planName?: string
  memberName?: string
  startDate: string
  endDate: string
  status: 'Active' | 'Expiring Soon' | 'Expired'
  amountPaid: number
  autoRenew: boolean
  createdAt: string
}

export interface ServiceDTO {
  id: string
  name: string
  category: string
  durationMin: number
  price: number
  isActive: boolean
}

export interface StaffDTO {
  id: string
  name: string
  role: string
  specialization: string | null
  commissionPct: number
  perDaySalary: number
  workingHours: string
  avatarUrl: string | null
  isActive: boolean
}

export interface AppointmentDTO {
  id: string
  memberId: string
  memberName?: string
  serviceId: string
  serviceName?: string
  staffId: string | null
  staffName?: string | null
  startsAt: string
  endsAt: string
  status: string
  notes: string | null
}

export interface PaymentDTO {
  id: string
  memberId: string
  memberName?: string
  membershipId: string | null
  appointmentId: string | null
  description?: string
  amount: number
  method: string
  status: string
  invoiceNo: string
  paidAt: string
}

export interface PackageDTO {
  id: string
  title: string
  type: string
  discountValue: number
  discountType: string
  validFrom: string
  validTo: string
  code: string
  isActive: boolean
}

export interface CampaignDTO {
  id: string
  name: string
  channel: string
  template: string
  segment: string
  scheduledAt: string | null
  status: string
  createdAt: string
}

export interface DashboardSummary {
  kpis: {
    totalMembers: number
    activeMemberships: number
    expiringSoon: number
    expired: number
    totalRevenue: number
    revenueThisMonth: number
    revenueLastMonth: number
    newMembersThisMonth: number
    todayEntryCount: number
    todayEntryRevenue: number
    presentToday: number
    absentToday: number
  }
  membershipBreakdown: { name: string; value: number; color: string }[]
  popularPlans: {
    id: string
    name: string
    memberCount: number
    revenue: number
    price: number
  }[]
  recentMembers: MemberDTO[]
  upcomingExpirations: MembershipDTO[]
  todaysAppointments: AppointmentDTO[]
  todaysEntries: DailyEntryDTO[]
  lastMonthReport: { yearMonth: string; entryCount: number; revenue: number } | null
}

export interface RevenuePoint {
  month: string
  revenue: number
}
export interface MemberGrowthPoint {
  month: string
  members: number
}
export interface PlanPerformancePoint {
  plan: string
  members: number
  revenue: number
}
export interface RetentionPoint {
  name: string
  value: number
  color: string
}

export interface DailyEntryDTO {
  id: string
  entryDate: string          // YYYY-MM-DD
  memberCode: string | null
  memberName: string
  phone: string | null
  serviceName: string
  therapistName: string | null
  amount: number
  paymentMode: string
  notes: string | null
  createdAt: string
}

export interface MonthlyReportMeta {
  yearMonth: string          // YYYY-MM
  label: string              // e.g., "September 2026"
  entryCount: number
  revenue: number
}

export interface StaffAttendanceDTO {
  id: string
  staffId: string
  staffName?: string
  date: string               // YYYY-MM-DD
  status: 'Present' | 'Half-Day' | 'Absent' | 'Leave' | 'Holiday'
  checkIn: string | null
  checkOut: string | null
  notes: string | null
  createdAt: string
}

export interface StaffSalaryRow {
  staffId: string
  staffName: string
  role: string
  perDaySalary: number
  presentDays: number
  halfDays: number
  absentDays: number
  leaveDays: number
  holidayDays: number
  totalDays: number
  computedSalary: number    // present * perDay + halfDay * perDay * 0.5
  deductions: number        // absent * perDay (informational)
  monthLabel: string
  yearMonth: string
}
