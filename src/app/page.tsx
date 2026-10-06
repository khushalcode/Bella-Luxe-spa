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
    getDashboardSummary(),
    getMembers(),
    getPlans(),
    getServices(),
    getStaff(),
    getAppointments(),
    getPayments(),
    getPackages(),
    getCampaigns(),
    getRevenueReport(),
    getMemberGrowthReport(),
    getPlanPerformanceReport(),
    getRetentionReport(),
    getDailyEntries(),                 // most recent first
    getMonthlyReports(),
    getMonthlyAttendance(),            // current month
    getMonthlySalary(),                // current month
    getAvailableMonths(),
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
