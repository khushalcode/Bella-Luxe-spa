"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, TrendingUp, Users, Crown, PieChart as PieIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpa } from "../SpaShell";
import { formatINR, exportCSV } from "@/lib/format";
import { toast } from "sonner";

export function ReportsView() {
  const { revenueReport, memberGrowth, planPerformance, retention } = useSpa();

  function handleExport(format: "pdf" | "excel") {
    const rows = revenueReport.map((r) => ({ Month: r.month, Revenue: r.revenue }));
    exportCSV(`bella-luxe-revenue.${format === "pdf" ? "csv" : "csv"}`, rows);
    toast.success(`Report exported`, {
      description: `Revenue report downloaded as ${format.toUpperCase()}.`,
    });
  }

  const tooltipStyle = {
    background: "#FFFFFF",
    border: "1px solid rgba(217,112,138,0.25)",
    borderRadius: "12px",
    boxShadow: "0 10px 25px -5px rgba(61,31,43,0.15)",
    fontSize: "12px",
  };

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Reports & Analytics</h1>
          <p className="text-[12.5px] text-[#7A6E66]">Real data from your spa&apos;s database</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport("pdf")}
            variant="outline"
            className="h-10 rounded-full border-[#D9708A]/25 bg-white/70 text-[12.5px] font-semibold text-[#3D1F2B] hover:bg-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button
            onClick={() => handleExport("excel")}
            variant="outline"
            className="h-10 rounded-full border-[#D9708A]/25 bg-white/70 text-[12.5px] font-semibold text-[#3D1F2B] hover:bg-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBE4E2] text-[#B8456A]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Revenue (6 months)</h3>
              </div>
            </div>
            <span className="text-[11px] text-[#7A6E66]">Total: {formatINR(revenueReport.reduce((s, r) => s + r.revenue, 0))}</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueReport} margin={{ left: -10, right: 10, top: 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D9708A" />
                    <stop offset="100%" stopColor="#B8456A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,112,138,0.12)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatINR(v), "Revenue"]} />
                <Bar dataKey="revenue" fill="url(#revGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member growth */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DDF3E8] text-[#2E9E6E]">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Member Growth</h3>
            </div>
            <span className="text-[11px] text-[#7A6E66]">{memberGrowth[memberGrowth.length - 1]?.members ?? 0} total</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memberGrowth} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,112,138,0.12)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Members"]} />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#2E9E6E"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#2E9E6E" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan performance */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCE8CF] text-[#E08A2E]">
                <Crown className="h-4 w-4" />
              </div>
              <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Plan Performance</h3>
            </div>
            <span className="text-[11px] text-[#7A6E66]">{planPerformance.reduce((s, p) => s + p.members, 0)} members</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planPerformance} layout="vertical" margin={{ left: 50, right: 10 }}>
                <defs>
                  <linearGradient id="planGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9A86A" />
                    <stop offset="100%" stopColor="#D9708A" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,112,138,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="plan" tick={{ fontSize: 11, fill: "#7A6E66" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [v, n === "members" ? "Members" : "Revenue"]} />
                <Bar dataKey="members" fill="url(#planGrad)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retention */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFE3F4] text-[#8B5CA6]">
                <PieIcon className="h-4 w-4" />
              </div>
              <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Retention</h3>
            </div>
            <span className="text-[11px] text-[#7A6E66]">Active vs Churned</span>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={retention} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none">
                  {retention.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [v, n]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
