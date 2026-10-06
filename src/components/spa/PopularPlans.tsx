"use client";

import { Crown, Flower, Flower2, Layers, ArrowRight } from "lucide-react";
import { useSpa } from "./SpaShell";
import { formatINR } from "@/lib/format";

const PLAN_STYLE: Record<
  string,
  { icon: React.ElementType; bg: string; fg: string }
> = {
  "Premium Glow": { icon: Flower2, bg: "#FBD3DC", fg: "#C8416B" },
  "Relax & Renew": { icon: Flower, bg: "#FCE3C6", fg: "#D9822B" },
  "Body Balance": { icon: Layers, bg: "#FBDCC2", fg: "#C9722F" },
  "Self-Care Plus": { icon: Flower2, bg: "#F9D1C9", fg: "#C5483F" },
};

export function PopularPlans() {
  const { summary, setView } = useSpa();
  const plans = summary.popularPlans;
  const max = plans.reduce((m, p) => Math.max(m, p.memberCount), 1);

  return (
    <div className="glass-card px-5 pb-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <Crown className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Popular Membership Plans
        </h3>
        <button
          onClick={() => setView("plans")}
          className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-[#7a2a55] hover:text-[#5d1f40]"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-[1.35fr_1.2fr_0.9fr] items-center rounded-lg bg-[#F6F3F2] px-3 py-2 text-[12.5px] font-medium text-[#6b6470]">
        <span>Plan Name</span>
        <span>Members</span>
        <span>Revenue</span>
      </div>

      <div className="mt-1.5">
        {plans.map((p) => {
          const st = PLAN_STYLE[p.name] ?? PLAN_STYLE["Premium Glow"];
          const Icon = st.icon;
          const pct = Math.round((p.memberCount / max) * 100);
          return (
            <div
              key={p.id}
              className="grid h-[44px] grid-cols-[1.35fr_1.2fr_0.9fr] items-center px-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </span>
                <span className="truncate text-[13px] text-[#2a2430]">
                  {p.name}
                </span>
              </div>
              <div className="pr-3">
                <div className="text-[12.5px] font-medium leading-none text-[#2a2430]">
                  {p.memberCount}
                </div>
                <div className="mt-1.5 h-[5px] w-full max-w-[104px] overflow-hidden rounded-full bg-[#ECE5E5]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d9507c] to-[#b5336a]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="text-[13px] text-[#2a2430]">
                {formatINR(p.revenue)}
              </div>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="py-6 text-center text-[12px] text-[#7A6E66]">
            No plans available.
          </div>
        )}
      </div>
    </div>
  );
}
