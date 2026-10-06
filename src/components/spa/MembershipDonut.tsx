"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { UserRound } from "lucide-react";
import { useSpa } from "./SpaShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS: Record<string, string> = {
  Active: "#0F7B53",
  "Expiring Soon": "#F6B04C",
  Expired: "#F0507F",
};
// Ring order (clockwise from ~11:30): Expired → Active → Expiring Soon
const RING_ORDER = ["Expired", "Active", "Expiring Soon"];

export function MembershipDonut() {
  const { summary } = useSpa();
  const data = summary.membershipBreakdown;
  const total = data.reduce((s, d) => s + d.value, 0);
  const ring = RING_ORDER.map((n) => data.find((d) => d.name === n)).filter(
    Boolean
  ) as typeof data;

  const [filter, setFilter] = useState("this-month");

  return (
    <div className="glass-card flex flex-col px-5 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <UserRound className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Membership Overview
        </h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-[104px] rounded-md border-[#2D1B30]/10 bg-white px-2.5 text-[12px] text-[#3a3340]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#2D1B30]/10 bg-white">
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 flex items-center gap-6 sm:gap-8">
        <div className="relative h-[168px] w-[168px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ring}
                dataKey="value"
                nameKey="name"
                startAngle={105}
                endAngle={-255}
                innerRadius={61}
                outerRadius={83}
                paddingAngle={1.5}
                stroke="none"
                isAnimationActive={false}
              >
                {ring.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] ?? entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[27px] font-semibold leading-none text-[#1b1530]">
              {total}
            </div>
            <div className="mt-1 text-[12px] text-[#4a4450]">Total Members</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3.5">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} className="flex items-center gap-2.5 text-[14px]">
                <span
                  className="h-[11px] w-[11px] shrink-0 rounded-full"
                  style={{ background: COLORS[d.name] ?? d.color }}
                />
                <span className="flex-1 text-[#2a2430]">{d.name}</span>
                <span className="font-semibold text-[#1b1530]">{d.value}</span>
                <span className="w-[46px] text-right text-[13.5px] text-[#4a4450]">
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
