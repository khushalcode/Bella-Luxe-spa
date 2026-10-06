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
import { useSpa } from "../SpaShell";
import { updateMember } from "@/app/actions/members";
import { toast } from "sonner";
import type { MemberDTO } from "@/lib/types";

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: MemberDTO | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { refresh } = useSpa();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "Female",
    dob: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        name: member.name ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
        gender: member.gender ?? "Female",
        dob: member.dob ?? "",
        address: member.address ?? "",
        notes: member.notes ?? "",
      });
    }
  }, [member]);

  async function handleSubmit() {
    if (!member) return;
    setSaving(true);
    try {
      await updateMember(member.id, {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        gender: form.gender,
        dob: form.dob || null,
        address: form.address || null,
        notes: form.notes || null,
      });
      toast.success("Member updated", {
        description: `${form.name} has been updated.`,
      });
      onOpenChange(false);
      refresh();
    } catch (e) {
      toast.error("Failed to update member", {
        description: e instanceof Error ? e.message : "Unknown error",
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
              Edit Member
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              {member?.memberCode} · {member?.name}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Phone" required>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[70px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
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
            {saving ? "Saving…" : "Save Changes"}
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
