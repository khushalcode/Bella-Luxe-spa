"use client";

import { useState } from "react";
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
import { createAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";

export function BookAppointmentDialog() {
  const { isBookApptOpen, setBookApptOpen, members, services, staff, refresh } =
    useSpa();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberId: "",
    serviceId: "",
    staffId: "none",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    notes: "",
  });

  function reset() {
    setForm({
      memberId: "",
      serviceId: "",
      staffId: "none",
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      notes: "",
    });
  }

  async function handleSubmit() {
    if (!form.memberId || !form.serviceId) {
      toast.error("Please choose a member and service");
      return;
    }
    setSaving(true);
    try {
      await createAppointment({
        memberId: form.memberId,
        serviceId: form.serviceId,
        staffId: form.staffId === "none" ? null : form.staffId,
        date: form.date,
        time: form.time,
        notes: form.notes || undefined,
      });
      toast.success("Appointment booked", {
        description: `Scheduled for ${form.date} at ${form.time}.`,
      });
      reset();
      setBookApptOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to book appointment", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isBookApptOpen}
      onOpenChange={(o) => {
        setBookApptOpen(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[520px]">
        <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-[20px] font-bold text-[#3D1F2B]">
              Book Appointment
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              Schedule a spa session for a member.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Member</Label>
            <Select
              value={form.memberId}
              onValueChange={(v) => setForm({ ...form, memberId: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.memberCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Service</Label>
            <Select
              value={form.serviceId}
              onValueChange={(v) => setForm({ ...form, serviceId: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.durationMin}m) · ₹{s.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Staff</Label>
            <Select
              value={form.staffId}
              onValueChange={(v) => setForm({ ...form, staffId: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue placeholder="Auto-assign" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="none">Auto-assign</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Time</Label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional session notes…"
              className="min-h-[60px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setBookApptOpen(false)}
            className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
          >
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            {saving ? "Booking…" : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
