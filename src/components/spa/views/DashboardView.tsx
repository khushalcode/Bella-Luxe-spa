"use client";

import { Users, Crown, Hourglass, IndianRupee, ClipboardList, UserCheck } from "lucide-react";
import { Hero } from "../Hero";
import { KpiCard } from "../KpiCard";
import { QuickActions } from "../QuickActions";
import { DailyEntriesCard } from "../DailyEntriesCard";
import { MonthlyReportBanner } from "../MonthlyReportBanner";
import { MembershipDonut } from "../MembershipDonut";
import { PromoBanner } from "../PromoBanner";
import { PopularPlans } from "../PopularPlans";
import { Expirations } from "../Expirations";
import { TodayAppointments } from "../TodayAppointments";
import { useSpa } from "../SpaShell";
import { formatINR } from "@/lib/format";

export function DashboardView() {
  const { summary } = useSpa();

  const activePct =
    summary.kpis.totalMembers > 0
      ? Math.round(
          (summary.kpis.activeMemberships / summary.kpis.totalMembers) * 100
        )
      : 0;

  return (
    <div className="animate-fade-up space-y-3.5 px-4 pb-4 md:px-6">
      <Hero />

      {/* Auto-generated monthly Excel report banner */}
      <MonthlyReportBanner />

      {/* KPI cards + quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.07fr)]">
        <KpiCard
          label="Total Members"
          value={summary.kpis.totalMembers}
          subInfo={`+${summary.kpis.newMembersThisMonth} this month`}
          trend="12%"
          icon={<Users className="h-7 w-7 fill-[#E0446A] text-[#E0446A]" strokeWidth={1.5} />}
          tile={["#FFE0E7", "#FFC9D5"]}
          wave="#F9B8C8"
        />
        <KpiCard
          label="Active Memberships"
          value={summary.kpis.activeMemberships}
          subInfo={`${activePct}% of total`}
          trend="8%"
          icon={<Crown className="h-7 w-7 fill-[#2F9E5B] text-[#2F9E5B]" strokeWidth={1.5} />}
          tile={["#DDF2E2", "#C6E8CF"]}
          wave="#9ED8AE"
        />
        <KpiCard
          label="Expiring Soon"
          value={summary.kpis.expiringSoon}
          subInfo="Within 30 days"
          alert
          icon={<Hourglass className="h-7 w-7 fill-[#F3A24B]/60 text-[#E8730C]" strokeWidth={1.7} />}
          tile={["#FFE6C8", "#FFD5A6"]}
          wave="#F9C98C"
        />
        <KpiCard
          label="Total Revenue"
          value={formatINR(summary.kpis.totalRevenue)}
          subInfo="This month"
          trend="18%"
          trendPlacement="below"
          icon={
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C4DCC] text-white shadow-sm">
              <IndianRupee className="h-4 w-4" strokeWidth={2.2} />
            </span>
          }
          tile={["#E8DEFA", "#D8CAF4"]}
          wave="#CDBBF0"
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <QuickActions />
        </div>
      </div>

      {/* Today's quick stats: Daily entries + Staff attendance */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBE4E2] text-[#B8456A]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Today&apos;s Entries</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">
              {summary.kpis.todayEntryCount} · {formatINR(summary.kpis.todayEntryRevenue)}
            </div>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF3E8] text-[#2E9E6E]">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Staff Present</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">
              {summary.kpis.presentToday} present · {summary.kpis.absentToday} absent
            </div>
          </div>
        </div>
        <div className="glass-card hidden items-center gap-3 px-4 py-3.5 lg:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE8CF] text-[#E08A2E]">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Active Memberships</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{summary.kpis.activeMemberships}</div>
          </div>
        </div>
        <div className="glass-card hidden items-center gap-3 px-4 py-3.5 lg:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFE3F4] text-[#8B5CA6]">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Expiring Soon</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{summary.kpis.expiringSoon}</div>
          </div>
        </div>
      </div>

      {/* Daily entries (today) | overview + banner */}
      <div className="grid gap-3.5 lg:grid-cols-[1.7fr_1fr]">
        <DailyEntriesCard />
        <div className="flex flex-col gap-3">
          <MembershipDonut />
          <PromoBanner />
        </div>
      </div>

      {/* Plans | Expirations | Appointments */}
      <div className="grid gap-3.5 lg:grid-cols-[1.09fr_1fr_1.08fr]">
        <PopularPlans />
        <Expirations />
        <TodayAppointments />
      </div>
    </div>
  );
}
