"use client";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  subInfo?: string;
  trend?: string;
  /** where the trend pill sits: beside the number (default) or under it */
  trendPlacement?: "beside" | "below";
  /** orange "!" marker beside the number instead of a trend pill */
  alert?: boolean;
  icon: React.ReactNode;
  /** [from, to] gradient of the rounded icon tile */
  tile: [string, string];
  /** colour of the soft wave at the bottom of the card */
  wave: string;
}

export function KpiCard({
  label,
  value,
  subInfo,
  trend,
  trendPlacement = "beside",
  alert,
  icon,
  tile,
  wave,
}: KpiCardProps) {
  const pill = trend ? (
    <span className="inline-flex items-center rounded-md bg-[#DFF3E6] px-1.5 py-0.5 text-[11.5px] font-medium text-[#2F8F5B]">
      ↑ {trend}
    </span>
  ) : null;

  return (
    <div className="glass-card relative overflow-hidden px-4 py-[18px]">
      {/* soft wave */}
      <svg
        viewBox="0 0 240 44"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-11 w-full"
        aria-hidden
      >
        <path
          d="M0 26 C40 8 84 42 134 26 S206 8 240 22 V44 H0 Z"
          fill={wave}
          opacity="0.35"
        />
        <path
          d="M0 34 C50 20 90 44 140 32 S210 20 240 30 V44 H0 Z"
          fill={wave}
          opacity="0.35"
        />
      </svg>

      <div className="relative flex items-center gap-3.5">
        <div
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          style={{ background: `linear-gradient(145deg, ${tile[0]}, ${tile[1]})` }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] text-[#2c2431]">{label}</div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                "text-[30px] font-semibold leading-[1.1] tracking-tight text-[#1b1530]",
                String(value).length > 6 && "text-[26px]"
              )}
            >
              {value}
            </span>
            {trendPlacement === "beside" && pill}
            {alert && (
              <span className="flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#F28C1F] text-[10px] font-bold leading-none text-white">
                !
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-[#6B6570]">
            {trendPlacement === "below" && pill}
            {subInfo}
          </div>
        </div>
      </div>
    </div>
  );
}
