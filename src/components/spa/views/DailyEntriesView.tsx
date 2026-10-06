"use client";

import { useState, useMemo } from "react";
import { Plus, Download, Search, Trash2, Pencil, ClipboardList, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSpa } from "../SpaShell";
import { AddDailyEntryDialog } from "../AddDailyEntryDialog";
import { deleteDailyEntry } from "@/app/actions/dailyEntries";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import type { DailyEntryDTO } from "@/lib/types";

export function DailyEntriesView() {
  const { dailyEntries, monthlyReports, refresh } = useSpa();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all" | "today" | ISO date

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return dailyEntries.filter((e) => {
      if (dateFilter === "today" && e.entryDate !== today) return false;
      if (dateFilter !== "all" && dateFilter !== "today" && e.entryDate !== dateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.memberName} ${e.memberCode ?? ""} ${e.phone ?? ""} ${e.serviceName} ${e.therapistName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dailyEntries, dateFilter, search, today]);

  const editEntry = dailyEntries.find((e) => e.id === editId) ?? null;
  const deleteEntry = dailyEntries.find((e) => e.id === deleteId) ?? null;

  // Day-wise totals for the visible list
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const totalEntries = filtered.length;

  // Today's totals (regardless of filter)
  const todayEntries = dailyEntries.filter((e) => e.entryDate === today);
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0);

  function handleDownloadExcel(yearMonth: string) {
    // Triggers a download via the API route — opens in a new tab so the
    // browser handles the .xls attachment without changing SPA state.
    const url = `/api/reports/monthly-excel?month=${encodeURIComponent(yearMonth)}`;
    window.open(url, "_blank", "noopener");
    toast.success("Excel report ready", {
      description: `Downloading ${yearMonth} monthly report…`,
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteDailyEntry(deleteId);
      toast.success("Daily entry deleted");
      setDeleteId(null);
      refresh();
    } catch (e) {
      toast.error("Failed to delete entry", {
        description: e instanceof Error ? e.message : "",
      });
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Daily Entries</h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {dailyEntries.length} total · {totalEntries} shown · {todayEntries.length} today (₹{todayTotal.toLocaleString("en-IN")})
          </p>
        </div>
        <Button
          onClick={() => {
            setEditId(null);
            setAddOpen(true);
          }}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Daily Entry
        </Button>
      </header>

      {/* Monthly reports — auto-generated Excel for each month with entries */}
      <div className="glass-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#7a2a55]" />
          <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">
            Monthly Excel Reports
          </h3>
          <span className="ml-1 text-[11px] text-[#7A6E66]">
            Auto-generated at month-end · click to download
          </span>
        </div>
        {monthlyReports.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-[#7A6E66]">
            No monthly reports yet. Reports become available as daily entries accumulate.
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {monthlyReports.map((r) => (
              <div
                key={r.yearMonth}
                className="flex items-center justify-between rounded-xl border border-[#D9708A]/15 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-[#3D1F2B]">
                    {r.label}
                  </div>
                  <div className="text-[11px] text-[#7A6E66]">
                    {r.entryCount} entries · {formatINR(r.revenue)}
                  </div>
                </div>
                <Button
                  onClick={() => handleDownloadExcel(r.yearMonth)}
                  size="sm"
                  className="h-8 shrink-0 rounded-full bg-[#2E9E6E] px-3 text-[11.5px] font-semibold text-white hover:bg-[#238558]"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Excel
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6E66]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, phone, service, therapist…"
            className="h-10 rounded-full border-[#D9708A]/15 bg-white pl-10 text-[12.5px]"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-10 w-full rounded-full border-[#D9708A]/15 bg-white text-[12.5px] md:w-[220px]">
            <SelectValue placeholder="Date filter" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today Only</SelectItem>
            <SelectItem value={today}>Pick Today ({today})</SelectItem>
            {/* Allow picking a specific date via input below */}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter !== "all" && dateFilter !== "today" ? dateFilter : ""}
          onChange={(e) => setDateFilter(e.target.value || "all")}
          className="h-10 rounded-full border-[#D9708A]/15 bg-white text-[12.5px] md:w-[180px]"
        />
      </div>

      {/* Daily entries table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
            <ClipboardList className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
            Entries Log
          </h3>
          <span className="text-[11px] text-[#7A6E66]">
            Total shown: {formatINR(totalAmount)}
          </span>
        </div>
        <div className="sidebar-scroll max-h-[640px] overflow-y-auto px-5 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
                <TableHead className="h-9 pl-3 text-[12.5px] font-medium text-[#6b6470] first:rounded-l-lg">#</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Date</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Member</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Phone</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Service</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Therapist</TableHead>
                <TableHead className="h-9 text-[12.5px] font-medium text-[#6b6470]">Mode</TableHead>
                <TableHead className="h-9 text-right text-[12.5px] font-medium text-[#6b6470]">Amount</TableHead>
                <TableHead className="h-9 text-center text-[12.5px] font-medium text-[#6b6470] last:rounded-r-lg">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e: DailyEntryDTO, i) => (
                <TableRow
                  key={e.id}
                  className="h-[41px] cursor-default border-b border-[#2D1B30]/[0.06] last:border-0 hover:bg-[#FBE4E2]/40"
                >
                  <TableCell className="py-1.5 pl-3 text-[13px] text-[#3a3340]">{i + 1}</TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">{e.entryDate}</TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex flex-col">
                      <span className="text-[13.5px] font-medium text-[#2a2430]">{e.memberName}</span>
                      <span className="text-[11px] text-[#7A6E66]">{e.memberCode ?? "Walk-in"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">{e.phone ?? "—"}</TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">{e.serviceName}</TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">{e.therapistName ?? "—"}</TableCell>
                  <TableCell className="py-1.5">
                    <span className="rounded-full bg-[#F1E5D8] px-2 py-0.5 text-[11px] font-medium text-[#7A6E66]">
                      {e.paymentMode}
                    </span>
                  </TableCell>
                  <TableCell className="py-1.5 text-right text-[13px] font-semibold text-[#3D1F2B]">
                    {formatINR(e.amount)}
                  </TableCell>
                  <TableCell className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full hover:bg-[#FBE4E2]"
                        onClick={() => {
                          setEditId(e.id);
                          setAddOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#7A6E66]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full hover:bg-[#FBDDE0]"
                        onClick={() => setDeleteId(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#D9364B]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-[12.5px] text-[#7A6E66]">
                    No entries match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddDailyEntryDialog
        open={addOpen}
        onOpenChange={(b) => {
          setAddOpen(b);
          if (!b) setEditId(null);
        }}
        entry={editEntry}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Daily Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete the entry for{" "}
              <span className="font-semibold text-[#1A1A1A]">{deleteEntry?.memberName}</span> on{" "}
              {deleteEntry?.entryDate}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-[#D9364B] text-white hover:bg-[#B92839]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
