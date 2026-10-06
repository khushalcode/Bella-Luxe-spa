"use client";

import { useState } from "react";
import { Download, Sparkles, X } from "lucide-react";
import { useSpa } from "./SpaShell";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

/**
 * Dashboard banner: shows a "ready to download" notification for the
 * previous month's auto-generated Excel report. The user can dismiss
 * the banner; clicking "Download Excel" streams the .xls file from
 * the API route.
 *
 * The "previous month" report is auto-detected by querying the DB
 * for entries in the previous YYYY-MM. This achieves the "automatic"
 * behavior described in the spec — every month, as soon as data
 * exists, the report becomes available for download without any
 * manual button click.
 */
export function MonthlyReportBanner() {
  const { summary } = useSpa();
  const [dismissed, setDismissed] = useState(false);
  const lastMonth = summary.lastMonthReport;

  if (!lastMonth || dismissed) return null;

  function handleDownload() {
    const url = `/api/reports/monthly-excel?month=${encodeURIComponent(lastMonth!.yearMonth)}`;
    window.open(url, "_blank", "noopener");
    toast.success("Excel report ready", {
      description: `Downloading ${lastMonth!.label} (${lastMonth!.entryCount} entries, ${formatINR(lastMonth!.revenue)})`,
    });
  }

  return (
    <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[#2E9E6E]/25 bg-gradient-to-r from-[#DDF3E8] via-[#EAF8F1] to-[#F8F1E9] px-5 py-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2E9E6E] text-white shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-[#1F5B3E]">
          {lastMonth.label} monthly Excel report is ready
        </div>
        <div className="text-[12px] text-[#3a6b51]">
          {lastMonth.entryCount} entries · {formatINR(lastMonth.revenue)} collected.
          Auto-generated and available for download.
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="flex h-9 items-center gap-1.5 rounded-full bg-[#2E9E6E] px-4 text-[12.5px] font-semibold text-white shadow-sm hover:bg-[#238558]"
      >
        <Download className="h-3.5 w-3.5" /> Download Excel
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[#3a6b51] hover:bg-[#2E9E6E]/15"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
