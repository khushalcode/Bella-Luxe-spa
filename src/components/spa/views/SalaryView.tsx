"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  Save,
  Users,
  TrendingUp,
  Calendar,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useSpa } from "../SpaShell";
import { updateStaff } from "@/app/actions/staff";
import { getMonthlySalary } from "@/app/actions/attendance";
import { colorForName, initials, formatINR } from "@/lib/format";
import { currentYearMonth, monthLabel } from "@/lib/dates";
import { toast } from "sonner";
import type { StaffDTO, StaffSalaryRow } from "@/lib/types";

/**
 * Set Salary (Admin) View
 *
 * Lets the admin set each staff member's per-day salary. The salary is used by
 * the Staff Attendance view's "Salary Calculation" tab to compute the monthly
 * payable amount based on attendance:
 *   Computed Salary = (Present days × per_day_salary)
 *                   + (Half-Day days × per_day_salary × 0.5)
 *
 * This view also shows a live preview of the current month's computed salary
 * for each staff based on the per-day salary entered here.
 */
export function SalaryView() {
  const { staff, refresh } = useSpa();
  const [editedSalaries, setEditedSalaries] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [salaryMonth, setSalaryMonth] = useState(currentYearMonth());
  const [salaryPreview, setSalaryPreview] = useState<StaffSalaryRow[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Initialize edited salaries from staff data
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const s of staff) {
      init[s.id] = String(s.perDaySalary ?? 0);
    }
    setEditedSalaries(init);
  }, [staff]);

  // Load salary preview when month changes or salaries change
  async function loadPreview(ym: string) {
    setLoadingPreview(true);
    try {
      const rows = await getMonthlySalary(ym);
      setSalaryPreview(rows);
    } catch (e) {
      toast.error("Failed to load salary preview", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoadingPreview(false);
    }
  }

  useEffect(() => {
    loadPreview(salaryMonth);
  }, [salaryMonth]);

  async function handleSave(staffId: string) {
    const value = editedSalaries[staffId];
    if (value === undefined) return;
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      toast.error("Please enter a valid positive number for per-day salary");
      return;
    }
    setSaving((s) => ({ ...s, [staffId]: true }));
    try {
      await updateStaff(staffId, { perDaySalary: num });
      toast.success("Per-day salary updated", {
        description: `${staff.find((s) => s.id === staffId)?.name}: ₹${num.toLocaleString("en-IN")} / day`,
      });
      refresh();
      // Reload the salary preview to reflect the new salary
      loadPreview(salaryMonth);
    } catch (e) {
      toast.error("Failed to update salary", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving((s) => ({ ...s, [staffId]: false }));
    }
  }

  async function handleSaveAll() {
    const updates = staff
      .map((s) => ({ id: s.id, value: editedSalaries[s.id], current: s.perDaySalary ?? 0 }))
      .filter((u) => u.value !== undefined && parseInt(u.value, 10) !== u.current);

    if (updates.length === 0) {
      toast.info("No changes to save");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    for (const u of updates) {
      try {
        await updateStaff(u.id, { perDaySalary: parseInt(u.value, 10) });
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (failCount === 0) {
      toast.success(`Saved ${successCount} salary updates`);
    } else {
      toast.warning(`${successCount} saved, ${failCount} failed`);
    }
    refresh();
    loadPreview(salaryMonth);
  }

  // Build a quick lookup of salary preview by staffId
  const previewById = new Map<string, StaffSalaryRow>();
  for (const r of salaryPreview) previewById.set(r.staffId, r);

  const totalMonthlyPayable = salaryPreview.reduce((s, r) => s + r.computedSalary, 0);
  const avgPerDaySalary =
    staff.length > 0
      ? Math.round(staff.reduce((s, st) => s + (st.perDaySalary ?? 0), 0) / staff.length)
      : 0;

  // Generate last 6 months for the picker
  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({ value: ym, label: monthLabel(ym) });
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">
            Set Salary (Admin)
          </h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            Define each staff member&apos;s per-day salary. The monthly salary is auto-computed from attendance.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Save className="mr-2 h-4 w-4" /> Save All Changes
        </Button>
      </header>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBE4E2] text-[#B8456A]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Total Staff</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{staff.length}</div>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF3E8] text-[#2E9E6E]">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Avg Per Day</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{formatINR(avgPerDaySalary)}</div>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE8CF] text-[#E08A2E]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">This Month Payable</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{formatINR(totalMonthlyPayable)}</div>
          </div>
        </div>
        <div className="glass-card flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFE3F4] text-[#8B5CA6]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#7A6E66]">Preview Month</div>
            <div className="text-[15px] font-bold text-[#3D1F2B]">{monthLabel(salaryMonth)}</div>
          </div>
        </div>
      </div>

      {/* Salary editor table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h3 className="text-[17px] font-semibold text-[#2a1a2b]">
            Per-Day Salary Editor
          </h3>
          <span className="text-[11px] text-[#7A6E66]">
            {staff.length} staff · changes save instantly per row or via &quot;Save All Changes&quot;
          </span>
        </div>
        <div className="sidebar-scroll max-h-[640px] overflow-y-auto px-5 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
                <TableHead className="pl-3 text-[12.5px] font-medium text-[#6b6470] first:rounded-l-lg">Staff</TableHead>
                <TableHead className="text-[12.5px] font-medium text-[#6b6470]">Role</TableHead>
                <TableHead className="text-right text-[12.5px] font-medium text-[#6b6470]">Current Per Day (₹)</TableHead>
                <TableHead className="text-right text-[12.5px] font-medium text-[#6b6470]">New Per Day (₹)</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470] last:rounded-r-lg">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s: StaffDTO) => {
                const c = colorForName(s.name);
                const currentValue = s.perDaySalary ?? 0;
                const newValue = editedSalaries[s.id] ?? "";
                const dirty = newValue !== "" && parseInt(newValue, 10) !== currentValue;
                const preview = previewById.get(s.id);
                return (
                  <TableRow
                    key={s.id}
                    className="h-[50px] border-b border-[#2D1B30]/[0.06] last:border-0 hover:bg-[#FBE4E2]/30"
                  >
                    <TableCell className="pl-3 py-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-white/60">
                          <AvatarFallback
                            className="text-[12px] font-bold"
                            style={{ background: c.bg, color: c.fg }}
                          >
                            {initials(s.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-[13px] font-semibold text-[#2a2430]">{s.name}</div>
                          <div className="text-[10.5px] text-[#7A6E66]">{s.specialization ?? "General"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="rounded-full bg-[#FBE4E2] px-2 py-0.5 text-[11px] font-medium text-[#B8456A]">
                        {s.role}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-right text-[13px] text-[#2a2430]">
                      ₹{currentValue.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Input
                        type="number"
                        value={newValue}
                        onChange={(e) =>
                          setEditedSalaries({ ...editedSalaries, [s.id]: e.target.value })
                        }
                        placeholder={String(currentValue)}
                        className={`h-9 w-[140px] rounded-lg border-[#D9708A]/15 bg-white text-right text-[13px] ${
                          dirty ? "border-[#D9708A] ring-2 ring-[#D9708A]/15" : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-center">
                      <Button
                        size="sm"
                        disabled={!dirty || saving[s.id]}
                        onClick={() => handleSave(s.id)}
                        className={`h-8 rounded-full px-3 text-[11.5px] font-semibold ${
                          dirty
                            ? "bg-gradient-to-r from-[#D9708A] to-[#B8456A] text-white hover:from-[#B8456A] hover:to-[#8E3454]"
                            : "bg-[#F3EEEE] text-[#9A8E84]"
                        }`}
                      >
                        {saving[s.id] ? "Saving…" : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-[12.5px] text-[#7A6E66]">
                    No staff found. Add staff in the Staff Management view first.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Live salary preview */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 px-5 pb-2 pt-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-[17px] font-semibold text-[#2a1a2b]">
            Live Salary Preview
          </h3>
          <div className="flex items-center gap-2">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Month:</Label>
            <Select value={salaryMonth} onValueChange={setSalaryMonth}>
              <SelectTrigger className="h-9 w-[180px] rounded-full border-[#D9708A]/15 bg-white text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadPreview(salaryMonth)}
              disabled={loadingPreview}
              className="h-9 rounded-full border-[#D9708A]/25 bg-white/70 text-[12px] font-semibold text-[#3D1F2B] hover:bg-white"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loadingPreview ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="sidebar-scroll max-h-[640px] overflow-y-auto px-5 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
                <TableHead className="pl-3 text-[12.5px] font-medium text-[#6b6470] first:rounded-l-lg">Staff</TableHead>
                <TableHead className="text-right text-[12.5px] font-medium text-[#6b6470]">Per Day (₹)</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Present</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Half</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Absent</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Leave</TableHead>
                <TableHead className="text-center text-[12.5px] font-medium text-[#6b6470]">Holiday</TableHead>
                <TableHead className="text-right text-[12.5px] font-bold text-[#3D1F2B] last:rounded-r-lg">Salary (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaryPreview.map((r) => {
                const c = colorForName(r.staffName);
                return (
                  <TableRow
                    key={r.staffId}
                    className="h-[44px] border-b border-[#2D1B30]/[0.06] last:border-0 hover:bg-[#FBE4E2]/30"
                  >
                    <TableCell className="pl-3 py-2">
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
                          <div className="text-[12.5px] font-semibold text-[#2a2430]">{r.staffName}</div>
                          <div className="text-[10.5px] text-[#7A6E66]">{r.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right text-[12.5px] text-[#2a2430]">
                      ₹{r.perDaySalary.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="py-2 text-center text-[12.5px] font-semibold text-[#1F5B3E]">
                      {r.presentDays}
                    </TableCell>
                    <TableCell className="py-2 text-center text-[12.5px] font-semibold text-[#A06100]">
                      {r.halfDays}
                    </TableCell>
                    <TableCell className="py-2 text-center text-[12.5px] font-semibold text-[#A11A2D]">
                      {r.absentDays}
                    </TableCell>
                    <TableCell className="py-2 text-center text-[12.5px] text-[#6A3D8B]">
                      {r.leaveDays}
                    </TableCell>
                    <TableCell className="py-2 text-center text-[12.5px] text-[#5A6B7B]">
                      {r.holidayDays}
                    </TableCell>
                    <TableCell className="py-2 text-right text-[13px] font-bold text-[#3D1F2B]">
                      {formatINR(r.computedSalary)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {salaryPreview.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-[12.5px] text-[#7A6E66]">
                    {loadingPreview ? "Loading…" : "No salary data for this month yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {salaryPreview.length > 0 && (
              <tfoot>
                <TableRow className="border-t-2 border-[#D9708A]/20 bg-[#F8F1E9]">
                  <TableCell colSpan={7} className="py-2.5 pl-3 text-right text-[13px] font-bold text-[#3D1F2B]">
                    TOTAL PAYABLE for {monthLabel(salaryMonth)}
                  </TableCell>
                  <TableCell className="py-2.5 text-right text-[14px] font-bold text-[#3D1F2B]">
                    {formatINR(totalMonthlyPayable)}
                  </TableCell>
                </TableRow>
              </tfoot>
            )}
          </Table>
        </div>
      </div>

      {/* Formula explanation */}
      <div className="glass-card p-4">
        <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#3D1F2B]">
          <Info className="h-4 w-4 text-[#7a2a55]" />
          How monthly salary is calculated
        </h4>
        <p className="text-[12px] leading-relaxed text-[#7A6E66]">
          <strong>Present</strong> day = full per-day salary.{" "}
          <strong>Half-Day</strong> = 0.5 × per-day salary.{" "}
          <strong>Absent / Leave / Holiday</strong> = ₹0 (not counted as payable days).
          <br />
          <strong>Computed Salary</strong> = (Present × perDay) + (Half-Day × perDay × 0.5).
          <br />
          The monthly salary auto-updates from the Staff Attendance view — every time you
          mark attendance, the salary recalculates. Records older than 60 days are
          auto-archived to keep the table lean.
        </p>
      </div>
    </div>
  );
}
