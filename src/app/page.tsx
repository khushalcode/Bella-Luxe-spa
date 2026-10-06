import { SpaShell, type SpaData } from "@/components/spa/SpaShell";
import { SpaLayout } from "@/components/spa/SpaLayout";
import { getDashboardSummary } from "@/app/actions/dashboard";
import { getMembers } from "@/app/actions/members";
import { getPlans } from "@/app/actions/plans";
import { getServices } from "@/app/actions/services";
import { getStaff } from "@/app/actions/staff";
import { getAppointments } from "@/app/actions/appointments";
import { getPayments } from "@/app/actions/payments";
import { getPackages } from "@/app/actions/packages";
import { getCampaigns } from "@/app/actions/campaigns";
import {
  getRevenueReport,
  getMemberGrowthReport,
  getPlanPerformanceReport,
  getRetentionReport,
} from "@/app/actions/reports";
import {
  getDailyEntries,
  getMonthlyReports,
} from "@/app/actions/dailyEntries";
import {
  getMonthlyAttendance,
  getMonthlySalary,
  getAvailableMonths,
} from "@/app/actions/attendance";

// Each loader returns an empty default on failure so the page renders
// even when Supabase env vars are not yet configured. The actual error
// is logged to the server console for the developer to see.
function safe<T>(label: string, p: Promise<T>, fallback: T): Promise<T> {
  return p.catch((e) => {
    console.error(`[loader:${label}]`, e instanceof Error ? e.message : e)
    return fallback
  })
}

export default async function Page() {
  const [
    summary,
    members,
    plans,
    services,
    staff,
    appointments,
    payments,
    packages,
    campaigns,
    revenueReport,
    memberGrowth,
    planPerformance,
    retention,
    dailyEntries,
    monthlyReports,
    attendance,
    salaryRows,
    attendanceMonths,
  ] = await Promise.all([
    safe("summary", getDashboardSummary(), {
      kpis: {
        totalMembers: 0, activeMemberships: 0, expiringSoon: 0, expired: 0,
        totalRevenue: 0, revenueThisMonth: 0, revenueLastMonth: 0, newMembersThisMonth: 0,
        todayEntryCount: 0, todayEntryRevenue: 0, presentToday: 0, absentToday: 0,
      },
      membershipBreakdown: [],
      popularPlans: [],
      recentMembers: [],
      upcomingExpirations: [],
      todaysAppointments: [],
      todaysEntries: [],
      lastMonthReport: null,
    }),
    safe("members", getMembers(), []),
    safe("plans", getPlans(), []),
    safe("services", getServices(), []),
    safe("staff", getStaff(), []),
    safe("appointments", getAppointments(), []),
    safe("payments", getPayments(), []),
    safe("packages", getPackages(), []),
    safe("campaigns", getCampaigns(), []),
    safe("revenueReport", getRevenueReport(), []),
    safe("memberGrowth", getMemberGrowthReport(), []),
    safe("planPerformance", getPlanPerformanceReport(), []),
    safe("retention", getRetentionReport(), []),
    safe("dailyEntries", getDailyEntries(), []),
    safe("monthlyReports", getMonthlyReports(), []),
    safe("attendance", getMonthlyAttendance(), []),
    safe("salaryRows", getMonthlySalary(), []),
    safe("attendanceMonths", getAvailableMonths(), []),
  ]);

  const initial: SpaData = {
    summary,
    members,
    plans,
    services,
    staff,
    appointments,
    payments,
    packages,
    campaigns,
    revenueReport,
    memberGrowth,
    planPerformance,
    retention,
    dailyEntries,
    monthlyReports,
    attendance,
    salaryRows,
    attendanceMonths,
  };

  return (
    <SpaShell initial={initial}>
      <SpaLayout />
    </SpaShell>
  );
}
