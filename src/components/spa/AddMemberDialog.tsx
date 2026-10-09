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
import { createMember } from "@/app/actions/members";
import { toast } from "sonner";

export function AddMemberDialog() {
  const { isAddMemberOpen, setAddMemberOpen, plans, refresh, mergeData, members } = useSpa();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "Female",
    dob: "",
    address: "",
    planId: "",
    startDate: new Date().toISOString().slice(0, 10),
    amountPaid: "",
    notes: "",
  });

  function reset() {
    setForm({
      name: "",
      phone: "",
      email: "",
      gender: "Female",
      dob: "",
      address: "",
      planId: "",
      startDate: new Date().toISOString().slice(0, 10),
      amountPaid: "",
      notes: "",
    });
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) {
      toast.error("Please fill name and phone");
      return;
    }
    if (!form.planId) {
      toast.error("Please choose a plan");
      return;
    }
    setSaving(true);
    try {
      const newMember = await createMember({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        gender: form.gender,
        dob: form.dob || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
        planId: form.planId,
        startDate: form.startDate,
        amountPaid: form.amountPaid ? parseInt(form.amountPaid, 10) : undefined,
      });
      // Optimistic update — instantly show new member in UI
      mergeData({ members: [newMember, ...members] });
      toast.success("Member added successfully", {
        description: `${form.name} has been added to your roster.`,
      });
      reset();
      setAddMemberOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to add member", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isAddMemberOpen}
      onOpenChange={(o) => {
        setAddMemberOpen(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[560px]">
        <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-[20px] font-bold text-[#3D1F2B]">
              Add New Member
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              Create a new member profile and assign a membership plan. An
              invoice is generated automatically.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Priya Sharma"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Gender">
            <Select
              value={form.gender}
              onValueChange={(v) => setForm({ ...form, gender: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of Birth">
            <Input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Sector 8, Chandigarh"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Membership Plan" required>
            <Select
              value={form.planId}
              onValueChange={(v) => setForm({ ...form, planId: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString("en-IN")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Start Date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Amount Paid (₹)">
            <Input
              type="number"
              value={form.amountPaid}
              onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
              placeholder="Auto-filled from plan"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preferences, allergies, special requests…"
                className="min-h-[70px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setAddMemberOpen(false)}
            className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
          >
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            {saving ? "Adding…" : "Add Member"}
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
