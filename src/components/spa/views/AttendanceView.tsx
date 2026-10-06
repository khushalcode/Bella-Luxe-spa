"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock3,
  Plane,
  PartyPopper,
  Save,
  IndianRupee,
  AlertTriangle,
  CalendarDays,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSpa } from "../SpaShell";
import {
  markAttendance,
  getMonthlyAttendance,
  getMonthlySalary,
  getAttendanceForDate,
  getAvailableMonths,
  cleanupOldAttendance,
} from "@/app/actions/attendance";
import { colorForName, initials, formatINR } from "@/lib/format";
import { toast } from "sonner";
import type { StaffAttendanceDTO, StaffSalaryRow } from "@/lib/types";
import { exportCSV } from "@/lib/format";

type Status = StaffAttendanceDTO["status"];

const STATUSES: Status[] = ["Present", "Half-Day", "Absent", "Leave", "Holiday"];

const STATUS_META: Record<Status, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  Present: { color: "#1F5B3E", bg: "#DDF3E8", icon: CheckCircle2, label: "Present" },
  "Half-Day": { color: "#A06100", bg: "#FCE8CF", icon: Clock3, label: "Half-Day" },
  Absent: { color: "#A11A2D", bg: "#FBDDE0", icon: XCircle, label: "Absent" },
  Leave: { color: "#6A3D8B", bg: "#EFE3F4", icon: Plane, label: "Leave" },
  Holiday: { color: "#5A6B7B", bg: "#E5EBF0", icon: PartyPopper, label: "Holiday" },
};

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ color: m.color, background: m.bg }}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

export function AttendanceView() {
  const { staff, attendance, salaryRows, attendanceMonths, refresh } = useSpa();

  // Today's date as default
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "salary">("daily");

  // Daily tab state
  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyRecords, setDailyRecords] = useState<StaffAttendanceDTO[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Monthly tab state
  const currentYM = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [monthlyRecords, setMonthlyRecords] = useState<StaffAttendanceDTO[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Salary tab state
  const [salaryMonth, setSalaryMonth] = useState(currentYM);
  const [salaryData, setSalaryData] = useState<StaffSalaryRow[]>(salaryRows);
  const [loadingSalary, setLoadingSalary] = useState(false);

  // Build a quick map of staffId -> attendance record for the selected date
  const recordsByStaff = useMemo(() => {
    const m = new Map<string, StaffAttendanceDTO>();
    for (const r of dailyRecords) m.set(r.staffId, r);
    return m;
  }, [dailyRecords]);

  // Initialize with today's attendance from the already-loaded `attendance` prop
  useEffect(() => {
    if (activeTab === "daily") {
      void loadDaily(selectedDate);
    }
  }, [selectedDate, activeTab]);

  // Load monthly when tab changes
  useEffect(() => {
    if (activeTab === "monthly") {
      void loadMonthly(selectedMonth);
    }
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    if (activeTab === "salary") {
      void loadSalary(salaryMonth);
    }
  }, [salaryMonth, activeTab]);

  async function loadDaily(date: string) {
    setLoadingDaily(true);
    try {
      const rows = await getAttendanceForDate(date);
      setDailyRecords(rows);
    } finally {
      setLoadingDaily(false);
    }
  }

  async function loadMonthly(ym: string) {
    setLoadingMonthly(true);
    try {
      const rows = await getMonthlyAttendance(ym);
      setMonthlyRecords(rows);
    } finally {
      setLoadingMonthly(false);
    }
  }

  async function loadSalary(ym: string) {
    setLoadingSalary(true);
    try {
      const rows = await getMonthlySalary(ym);
      setSalaryData(rows);
    } finally {
      setLoadingSalary(false);
    }
  }

  async function handleMark(staffId: string, status: Status) {
    setSaving((s) => ({ ...s, [staffId]: true }));
    try {
      const checkIn = status === "Present" || status === "Half-Day" ? "09:30" : null;
      const checkOut = status === "Present" ? "18:00" : status === "Half-Day" ? "14:00" : null;
      await markAttendance({
        staffId,
        date: selectedDate,
        status,
        checkIn,
        checkOut,
      });
      // Update local state immediately for snappy UI
      setDailyRecords((prev) => {
        const idx = prev.findIndex((r) => r.staffId === staffId);
        const newRec: StaffAttendanceDTO = {
          id: idx >= 0 ? prev[idx].id : "",
          staffId,
          staffName: staff.find((s) => s.id === staffId)?.name,
          date: selectedDate,
          status,
          checkIn,
          checkOut,
          notes: idx >= 0 ? prev[idx].notes : null,
          createdAt: idx >= 0 ? prev[idx].createdAt : new Date().toISOString(),
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = newRec;
          return next;
        }
        return [...prev, newRec];
      });
      toast.success(`${staff.find((s) => s.id === staffId)?.name ?? "Staff"} marked as ${status}`);
    } catch (e) {
      toast.error("Failed to mark attendance", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving((s) => ({ ...s, [staffId]: false }));
      refresh();
    }
  }

  async function handleArchive() {
    try {
      const res = await cleanupOldAttendance();
      toast.success(`Archived ${res.deleted} records older than 60 days`, {
        description: "Old attendance has been auto-removed from the active list.",
      });
      refresh();
    } catch (e) {
      toast.error("Failed to archive old records", {
        description: e instanceof Error ? e.message : "",
      });
    }
  }

  function handleExportMonthly() {
    if (monthlyRecords.length === 0) {
      toast.error("No attendance records to export for this month");
      return;
    }
    const rows = monthlyRecords.map((r, i) => ({
      "#": i + 1,
      Date: r.date,
      Staff: r.staffName ?? "",
      Status: r.status,
      CheckIn: r.checkIn ?? "",
      CheckOut: r.checkOut ?? "",
      Notes: r.notes ?? "",
    }));
    exportCSV(`bella-luxe-attendance-${selectedMonth}.csv`, rows);
    toast.success("Attendance exported", {
      description: `${rows.length} records downloaded.`,
    });
  }

  function handleExportSalary() {
    if (salaryData.length === 0) {
      toast.error("No salary data to export");
      return;
    }
    const rows = salaryData.map((s, i) => ({
      "#": i + 1,
      Staff: s.staffName,
      Role: s.role,
      "Per Day Salary": s.perDaySalary,
      Present: s.presentDays,
      "Half-Day": s.halfDays,
      Absent: s.absentDays,
      Leave: s.leaveDays,
      Holiday: s.holidayDays,
      "Computed Salary": s.computedSalary,
      Deductions: s.deductions,
      Month: s.monthLabel,
    }));
    exportCSV(`bella-luxe-salary-${salaryMonth}.csv`, rows);
    toast.success("Salary report exported", { description: `${rows.length} staff records downloaded.` });
  }

  // ------- Daily summary cards
  const dailySummary = useMemo(() => {
    const summary = { Present: 0, "Half-Day": 0, Absent: 0, Leave: 0, Holiday: 0, Unmarked: 0 };
    for (const s of staff) {
      const r = recordsByStaff.get(s.id);
      if (!r) summary.Unmarked += 1;
      else summary[r.status] += 1;
    }
    return summary;
  }, [recordsByStaff, staff]);

  // ------- Monthly pivot: rows = dates, cols = staff
  const monthlyPivot = useMemo(() => {
    const datesSet = new Set<string>();
    const byStaffDate = new Map<string, StaffAttendanceDTO>();
    for (const r of monthlyRecords) {
      datesSet.add(r.date);
      byStaffDate.set(`${r.staffId}|${r.date}`, r);
    }
    const dates = Array.from(datesSet).sort();
    return { dates, byStaffDate };
  }, [monthlyRecords]);

  // ------- Monthly summary
  const monthlySummary = useMemo(() => {
    const c = { Present: 0, "Half-Day": 0, Absent: 0, Leave: 0, Holiday: 0 };
    for (const r of monthlyRecords) c[r.status] += 1;
    return c;
  }, [monthlyRecords]);

  const totalSalaryThisMonth = salaryData.reduce((s, r) => s + r.computedSalary, 0);

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">
            Staff Attendance
          </h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {staff.length} staff · {dailySummary.Present} present today · {dailySummary.Absent} absent · auto-archives after 60 days
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleArchive}
            variant="outline"
            className="h-10 rounded-full border-[#D9708A]/25 bg-white/70 text-[12.5px] font-semibold text-[#3D1F2B] hover:bg-white"
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Archive Old Records
          </Button>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="glass-card flex items-center gap-1 p-1.5">
        {[
          { key: "daily" as const, label: "Daily Marking", icon: CalendarClock },
          { key: "monthly" as const, label: "Monthly Report", icon: CalendarDays },
          { key: "salary" as const, label: "Salary Calculation", icon: IndianRupee },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[12.5px] font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-[#D9708A] to-[#B8456A] text-white shadow-rose-glow"
                  : "text-[#7A6E66] hover:bg-[#FBE4E2]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ---------- DAILY TAB ---------- */}
      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 w-[180px] rounded-full border-[#D9708A]/15 bg-white text-[12.5px]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
              {STATUSES.map((s) => {
                const m = STATUS_META[s];
                const Icon = m.icon;
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
                    style={{ color: m.color, background: m.bg }}
                  >
                    <Icon className="h-3 w-3" />
                    {dailySummary[s]}
                  </span>
                );
              })}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EEEE] px-2.5 py-1 font-semibold text-[#6b6470]">
                Unmarked: {dailySummary.Unmarked}
              </span>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h3 className="text-[17px] font-semibold text-[#2a1a2b]">
                Mark attendance for {selectedDate}
              </h3>
              {loadingDaily && (
                <span className="text-[11px] text-[#7A6E66]">Loading…</span>
              )}
            </div>
            <div className="sidebar-scroll max-h-[600px] overflow-y-auto px-5 pb-4">
              <ul className="space-y-2.5">
                {staff.map((s) => {
                  const rec = recordsByStaff.get(s.id);
                  const current = rec?.status ?? null;
                  const c = colorForName(s.name);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-[#D9708A]/10 bg-white/60 px-4 py-3"
                    >
                      <Avatar className="h-10 w-10 border border-white/60">
                        <AvatarFallback
                          className="text-[13px] font-bold"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          {initials(s.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-semibold text-[#2a2430]">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-[#7A6E66]">
                          {s.role} · {s.specialization ?? "General"}
                        </div>
                      </div>
                      {rec && <StatusBadge status={rec.status} />}
                      <div className="flex items-center gap-1.5">
                        {STATUSES.map((st) => {
                          const m = STATUS_META[st];
                          const Icon = m.icon;
                          const active = current === st;
                          const busy = saving[s.id];
                          return (
                            <button
                              key={st}
                              disabled={busy}
                              onClick={() => handleMark(s.id, st)}
                              title={m.label}
                              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                                active ? "ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"
                              }`}
                              style={{
                                background: m.bg,
                                color: m.color,
                                ...(active ? { boxShadow: `0 0 0 2px ${m.color}` } : {}),
                              }}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MONTHLY TAB ---------- */}
      {activeTab === "monthly" && (
        <div className="space-y-4">
          <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-10 w-[180px] rounded-full border-[#D9708A]/15 bg-white text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
                  {(attendanceMonths.length > 0
                    ? attendanceMonths
                    : [
                        {
                          yearMonth: currentYM,
                          label: new Date().toLocaleString("en-GB", { month: "long", year: "numeric" }),
                          count: 0,
                        },
                      ]
                  ).map((m) => (
                    <SelectItem key={m.yearMonth} value={m.yearMonth}>
                      {m.label} ({m.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUSES.map((s) => {
                const m = STATUS_META[s];
                const Icon = m.icon;
                return (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                    style={{ color: m.color, background: m.bg }}
                  >
                    <Icon className="h-3 w-3" />
                    {monthlySummary[s]}
                  </span>
                );
              })}
              <Button
                onClick={handleExportMonthly}
                variant="outline"
                className="h-9 rounded-full border-[#D9708A]/25 bg-white/70 text-[12px] font-semibold text-[#3D1F2B] hover:bg-white"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h3 className="text-[17px] font-semibold text-[#2a1a2b]">
                Date-wise attendance · {monthlyPivot.dates.length} days
              </h3>
              {loadingMonthly && (
                <span className="text-[11px] text-[#7A6E66]">Loading…</span>
              )}
            </div>
            <div className="sidebar-scroll max-h-[640px] overflow-auto px-5 pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
                    <TableHead className="sticky left-0 z-10 bg-[#F6F3F2] pl-3 text-[12.5px] font-medium text-[#6b6470]">
                      Staff
                    </TableHead>
                    {monthlyPivot.dates.map((d) => (
                      <TableHead
                        key={d}
                        className="text-center text-[11px] font-medium text-[#6b6470]"
                      >
                        {d.slice(-2)}
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-[11px] font-bold text-[#3D1F2B]">
                      Present
                    </TableHead>
                    <TableHead className="text-center text-[11px] font-bold text-[#A06100]">
                      Half
                    </TableHead>
                    <TableHead className="text-center text-[11px] font-bold text-[#A11A2D]">
                      Absent
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => {
                    const c = colorForName(s.name);
                    let pCount = 0, hCount = 0, aCount = 0;
                    for (const d of monthlyPivot.dates) {
                      const r = monthlyPivot.byStaffDate.get(`${s.id}|${d}`);
                      if (r?.status === "Present") pCount += 1;
                      else if (r?.status === "Half-Day") hCount += 1;
                      else if (r?.status === "Absent") aCount += 1;
                    }
                    return (
                      <TableRow
                        key={s.id}
                        className="border-b border-[#2D1B30]/[0.06] last:border-0 hover:bg-[#FBE4E2]/30"
                      >
                        <TableCell className="sticky left-0 z-10 bg-white py-2 pl-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-white/60">
                              <AvatarFallback
                                className="text-[10.5px] font-bold"
                                style={{ background: c.bg, color: c.fg }}
                              >
                                {initials(s.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-[12.5px] font-semibold text-[#2a2430]">
                                {s.name}
                              </div>
                              <div className="text-[10.5px] text-[#7A6E66]">{s.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        {monthlyPivot.dates.map((d) => {
                          const r = monthlyPivot.byStaffDate.get(`${s.id}|${d}`);
                          if (!r) {
                            return (
                              <TableCell
                                key={d}
                                className="px-1 py-1 text-center text-[11px] text-[#ccc]"
                              >
                                —
                              </TableCell>
                            );
                          }
                          const m = STATUS_META[r.status];
                          const Icon = m.icon;
                          return (
                            <TableCell key={d} className="px-1 py-1 text-center">
                              <span
                                title={`${r.status} · ${d}`}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full"
                                style={{ background: m.bg, color: m.color }}
                              >
                                <Icon className="h-3 w-3" />
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center text-[12px] font-bold text-[#1F5B3E]">
                          {pCount}
                        </TableCell>
                        <TableCell className="text-center text-[12px] font-bold text-[#A06100]">
                          {hCount}
                        </TableCell>
                        <TableCell className="text-center text-[12px] font-bold text-[#A11A2D]">
                          {aCount}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {monthlyRecords.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={monthlyPivot.dates.length + 4}
                        className="py-10 text-center text-[12.5px] text-[#7A6E66]"
                      >
                        No attendance records for this month yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ---------- SALARY TAB ---------- */}
      {activeTab === "salary" && (
        <div className="space-y-4">
          <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Salary Month</Label>
              <Select value={salaryMonth} onValueChange={setSalaryMonth}>
                <SelectTrigger className="h-10 w-[180px] rounded-full border-[#D9708A]/15 bg-white text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
                  {(attendanceMonths.length > 0
                    ? attendanceMonths
                    : [
                        {
                          yearMonth: currentYM,
                          label: new Date().toLocaleString("en-GB", { month: "long", year: "numeric" }),
                          count: 0,
                        },
                      ]
                  ).map((m) => (
                    <SelectItem key={m.yearMonth} value={m.yearMonth}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#7A6E66]">
                Total payable: <strong className="text-[#3D1F2B]">{formatINR(totalSalaryThisMonth)}</strong>
              </span>
              <Button
                onClick={handleExportSalary}
                variant="outline"
                className="h-9 rounded-full border-[#D9708A]/25 bg-white/70 text-[12px] font-semibold text-[#3D1F2B] hover:bg-white"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h3 className="text-[17px] font-semibold text-[#2a1a2b]">
                Salary calculation · {salaryData.length} staff
              </h3>
              {loadingSalary && (
                <span className="text-[11px] text-[#7A6E66]">Loading…</span>
              )}
            </div>
            <div className="sidebar-scroll max-h-[640px] overflow-auto px-5 pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
                    <TableHead className="pl-3 text-[12.5px] font-medium text-[#6b6470] first:rounded-l-lg">
                      Staff
                    </TableHead>
                    <TableHead className="text-right text-[12.5px] font-medium text-[#6b6470]">Per Day (₹)</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Present</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Half</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Absent</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Leave</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Holiday</TableHead>
                    <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Total</TableHead>
                    <TableHead className="text-right text-[12.5px] font-bold text-[#3D1F2B] last:rounded-r-lg">
                      Salary (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryData.map((r) => {
                    const c = colorForName(r.staffName);
                    return (
                      <TableRow
                        key={r.staffId}
                        className="h-[42px] border-b border-[#2D1B30]/[0.06] last:border-0 hover:bg-[#FBE4E2]/30"
                      >
                        <TableCell className="pl-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 border border-white/60">
                              <AvatarFallback
                                className="text-[10.5px] font-bold"
                                style={{ background: c.bg, color: c.fg }}
                              >
                                {initials(r.staffName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-[12.5px] font-semibold text-[#2a2430]">
                                {r.staffName}
                              </div>
                              <div className="text-[10.5px] text-[#7A6E66]">{r.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] text-[#2a2430]">
                          ₹{r.perDaySalary.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] font-semibold text-[#1F5B3E]">
                          {r.presentDays}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] font-semibold text-[#A06100]">
                          {r.halfDays}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] font-semibold text-[#A11A2D]">
                          {r.absentDays}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] text-[#6A3D8B]">
                          {r.leaveDays}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] text-[#5A6B7B]">
                          {r.holidayDays}
                        </TableCell>
                        <TableCell className="text-center text-[12.5px] text-[#2a2430]">
                          {r.totalDays}
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-bold text-[#3D1F2B]">
                          {formatINR(r.computedSalary)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {salaryData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-10 text-center text-[12.5px] text-[#7A6E66]"
                      >
                        No salary data for this month yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {salaryData.length > 0 && (
                  <tfoot>
                    <TableRow className="border-t-2 border-[#D9708A]/20 bg-[#F8F1E9]">
                      <TableCell colSpan={8} className="py-2.5 pl-3 text-right text-[13px] font-bold text-[#3D1F2B]">
                        TOTAL PAYABLE
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-[14px] font-bold text-[#3D1F2B]">
                        {formatINR(totalSalaryThisMonth)}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                )}
              </Table>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#3D1F2B]">
              <IndianRupee className="h-4 w-4 text-[#7a2a55]" />
              Salary calculation formula
            </h4>
            <p className="text-[12px] leading-relaxed text-[#7A6E66]">
              <strong>Present</strong> = full per-day salary.{" "}
              <strong>Half-Day</strong> = 0.5 × per-day salary.{" "}
              <strong>Absent / Leave / Holiday</strong> = ₹0 (not counted as payable days).
              Computed salary = (Present × perDay) + (Half-Day × perDay × 0.5). Set
              each staff&apos;s per-day salary in the Staff Management view.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
