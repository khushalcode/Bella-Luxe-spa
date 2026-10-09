"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpa } from "./SpaShell";
import { createDailyEntry, updateDailyEntry } from "@/app/actions/dailyEntries";
import { toast } from "sonner";
import type { DailyEntryDTO } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  /** If set, dialog is editing this entry. */
  entry?: DailyEntryDTO | null;
  /** Initial date (YYYY-MM-DD) for new entries. Defaults to today. */
  initialDate?: string;
}

export function AddDailyEntryDialog({ open, onOpenChange, entry, initialDate }: Props) {
  const { members, services, staff, refresh, mergeData, dailyEntries } = useSpa();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entryDate: initialDate ?? new Date().toISOString().slice(0, 10),
    isMember: "member" as "member" | "walkin",
    memberId: "",
    memberCode: "",
    memberName: "",
    phone: "",
    serviceName: "",
    therapistName: "",
    amount: "",
    paymentMode: "Cash",
    notes: "",
  });

  useEffect(() => {
    if (entry) {
      setForm({
        entryDate: entry.entryDate,
        isMember: entry.memberCode ? "member" : "walkin",
        memberId: "",
        memberCode: entry.memberCode ?? "",
        memberName: entry.memberName ?? "",
        phone: entry.phone ?? "",
        serviceName: entry.serviceName,
        therapistName: entry.therapistName ?? "",
        amount: String(entry.amount),
        paymentMode: entry.paymentMode,
        notes: entry.notes ?? "",
      });
    } else {
      setForm({
        entryDate: initialDate ?? new Date().toISOString().slice(0, 10),
        isMember: "member",
        memberId: "",
        memberCode: "",
        memberName: "",
        phone: "",
        serviceName: "",
        therapistName: "",
        amount: "",
        paymentMode: "Cash",
        notes: "",
      });
    }
  }, [entry, initialDate, open]);

  // When user selects a member from dropdown, auto-fill name/phone/code
  useEffect(() => {
    if (form.memberId) {
      const m = members.find((mm) => mm.id === form.memberId);
      if (m) {
        setForm((f) => ({
          ...f,
          memberCode: m.memberCode,
          memberName: m.name,
          phone: m.phone,
        }));
      }
    }
  }, [form.memberId, members]);

  async function handleSubmit() {
    if (!form.memberName.trim()) {
      toast.error("Please enter member/guest name");
      return;
    }
    if (!form.serviceName.trim()) {
      toast.error("Please enter the service name");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entryDate: form.entryDate,
        memberCode: form.isMember === "walkin" ? null : form.memberCode || null,
        memberName: form.memberName,
        phone: form.phone || null,
        serviceName: form.serviceName,
        therapistName: form.therapistName || null,
        amount: parseInt(form.amount || "0", 10) || 0,
        paymentMode: form.paymentMode,
        notes: form.notes || null,
      };
      if (entry) {
        await updateDailyEntry(entry.id, payload);
        // Optimistic update — instantly reflect in UI
        mergeData({
          dailyEntries: dailyEntries.map((e) =>
            e.id === entry.id ? { ...e, ...payload, id: entry.id } as DailyEntryDTO : e
          ),
        });
        toast.success("Daily entry updated");
      } else {
        const newEntry = await createDailyEntry(payload);
        // Optimistic update — instantly prepend to UI
        mergeData({
          dailyEntries: [newEntry, ...dailyEntries],
        });
        toast.success("Daily entry added");
      }
      onOpenChange(false);
      refresh();
    } catch (e) {
      toast.error("Failed to save entry", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[560px]">
        <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-[20px] font-bold text-[#3D1F2B]">
              {entry ? "Edit Daily Entry" : "Add Daily Entry"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              Record a customer visit, the service they took and the amount collected.
              Used for the monthly Excel report.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Date" required>
            <Input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Customer Type">
            <Select
              value={form.isMember}
              onValueChange={(v: "member" | "walkin") => setForm({ ...form, isMember: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="walkin">Walk-in Guest</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {form.isMember === "member" && !entry && (
            <div className="sm:col-span-2">
              <Field label="Pick Existing Member (optional — auto-fills name/phone/code)">
                <Select
                  value={form.memberId}
                  onValueChange={(v) => setForm({ ...form, memberId: v })}
                >
                  <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                    <SelectValue placeholder="Choose from members…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-lg border-[#D9708A]/15 bg-white">
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} · {m.memberCode} · {m.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          <Field label="Member Code">
            <Input
              value={form.memberCode}
              onChange={(e) => setForm({ ...form, memberCode: e.target.value })}
              placeholder="BLM-001 (or blank for walk-in)"
              disabled={form.isMember === "walkin"}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Member / Guest Name" required>
            <Input
              value={form.memberName}
              onChange={(e) => setForm({ ...form, memberName: e.target.value })}
              placeholder="Priya Sharma"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Service" required>
            {services.length > 0 ? (
              <Select
                value={form.serviceName}
                onValueChange={(v) => setForm({ ...form, serviceName: v })}
              >
                <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name} · ₹{s.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                placeholder="Aromatherapy Massage"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            )}
          </Field>
          <Field label="Therapist (optional)">
            <Select
              value={form.therapistName}
              onValueChange={(v) => setForm({ ...form, therapistName: v === "__none__" ? "" : v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue placeholder="Auto-assign" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="__none__">— Auto-assign —</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name} · {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Amount (₹)">
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="2500"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Payment Mode">
            <Select
              value={form.paymentMode}
              onValueChange={(v) => setForm({ ...form, paymentMode: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes (optional)">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preferences, complaints, special requests…"
                className="min-h-[60px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
          >
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            {saving ? "Saving…" : entry ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-[#3D1F2B]">
        {label}
        {required && <span className="ml-0.5 text-[#D9364B]">*</span>}
      </Label>
      {children}
    </div>
  );
}
