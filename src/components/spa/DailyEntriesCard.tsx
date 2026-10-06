"use client";

import { useState } from "react";
import { Plus, ClipboardList, IndianRupee } from "lucide-react";
import { useSpa } from "./SpaShell";
import { AddDailyEntryDialog } from "./AddDailyEntryDialog";
import { formatINR } from "@/lib/format";

/**
 * Dashboard card showing today's daily entries.
 * Replaces the old RecentMembers card on the dashboard.
 */
export function DailyEntriesCard() {
  const { summary, setView } = useSpa();
  const [addOpen, setAddOpen] = useState(false);
  const todays = summary.todaysEntries ?? [];
  const total = todays.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <ClipboardList className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Today&apos;s Entries
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#7A6E66]">
            {todays.length} entries · {formatINR(total)}
          </span>
          <button
            onClick={() => setView("daily-entries")}
            className="text-[12.5px] font-medium text-[#7a2a55] hover:text-[#5d1f40]"
          >
            View All →
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-5 pb-3">
        <button
          onClick={() => setAddOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-4 text-[12px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="h-3.5 w-3.5" /> Add New Entry
        </button>
      </div>
      <div className="sidebar-scroll max-h-[280px] flex-1 overflow-y-auto px-5 pb-4">
        {todays.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <ClipboardList className="h-8 w-8 text-[#D9708A]/40" strokeWidth={1.5} />
            <p className="text-[12.5px] text-[#7A6E66]">No entries logged today.</p>
            <p className="text-[11px] text-[#9A8E84]">Click &quot;Add New Entry&quot; to record the first one.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todays.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-[#D9708A]/10 bg-white/60 px-3 py-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBE4E2] text-[#B8456A]">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[#2a2430]">
                    {e.memberName}
                    <span className="ml-2 text-[11px] text-[#9A8E84]">{e.memberCode}</span>
                  </div>
                  <div className="truncate text-[11px] text-[#7A6E66]">
                    {e.serviceName} · {e.therapistName ?? "Auto-assigned"} · {e.paymentMode}
                  </div>
                </div>
                <div className="shrink-0 text-[13px] font-semibold text-[#3D1F2B]">
                  {formatINR(e.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AddDailyEntryDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
