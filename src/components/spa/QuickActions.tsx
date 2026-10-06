"use client";

import { Plus, CalendarCheck, FileText } from "lucide-react";
import { useSpa } from "./SpaShell";

export function QuickActions() {
  const { setAddMemberOpen, setBookApptOpen, setCreateInvoiceOpen } = useSpa();
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#2b1520] to-[#1b0e16] p-3.5 shadow-[0_8px_24px_rgba(40,15,30,0.28)]">
      <button
        onClick={() => setAddMemberOpen(true)}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-gradient-to-r from-[#d1607f] via-[#b4476f] to-[#7d3f78] text-[14px] font-medium text-white shadow-[0_6px_16px_rgba(190,70,110,0.35)] transition-all hover:brightness-110"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Add New Member
      </button>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setBookApptOpen(true)}
          className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.06] text-[11.5px] font-medium text-white/95 transition-colors hover:bg-white/10"
        >
          <CalendarCheck className="h-3.5 w-3.5" />
          Book Appointment
        </button>
        <button
          onClick={() => setCreateInvoiceOpen(true)}
          className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.06] text-[11.5px] font-medium text-white/95 transition-colors hover:bg-white/10"
        >
          <FileText className="h-3.5 w-3.5" />
          Create Invoice
        </button>
      </div>
    </div>
  );
}
