"use client";

import { Hourglass, ArrowRight } from "lucide-react";
import { useSpa } from "./SpaShell";
import { formatDate } from "@/lib/format";
import { MemberAvatar } from "./MemberAvatar";

export function Expirations() {
  const { summary, setView } = useSpa();
  const list = summary.upcomingExpirations;

  return (
    <div className="glass-card px-5 pb-4 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <Hourglass className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Upcoming Expirations
        </h3>
        <button
          onClick={() => setView("members")}
          className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-[#7a2a55] hover:text-[#5d1f40]"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-[1.35fr_1.1fr_0.9fr] items-center rounded-lg bg-[#F6F3F2] px-3 py-2 text-[12.5px] font-medium text-[#6b6470]">
        <span>Name</span>
        <span>Plan</span>
        <span>Expiry Date</span>
      </div>

      <div className="mt-1.5">
        {list.map((m) => (
          <div
            key={m.id}
            className="grid h-[36px] grid-cols-[1.35fr_1.1fr_0.9fr] items-center px-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <MemberAvatar name={m.memberName ?? ""} size={32} />
              <span className="truncate text-[12.5px] text-[#2a2430]">
                {m.memberName}
              </span>
            </div>
            <span className="truncate text-[12.5px] text-[#2a2430]">
              {m.planName}
            </span>
            <span className="text-[12.5px] font-medium text-[#E0305F]">
              {formatDate(m.endDate)}
            </span>
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-6 text-center text-[12px] text-[#7A6E66]">
            No upcoming expirations.
          </div>
        )}
      </div>
    </div>
  );
}
