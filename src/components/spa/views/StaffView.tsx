"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Percent, User, Pencil, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createStaff, updateStaff, toggleStaff, deleteStaff } from "@/app/actions/staff";
import { toast } from "sonner";
import { colorForName, initials } from "@/lib/format";
import type { StaffDTO } from "@/lib/types";

export function StaffView() {
  const { staff, refresh } = useSpa();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "Therapist",
    specialization: "",
    commissionPct: "10",
    perDaySalary: "1000",
    startHour: "09:00",
    endHour: "18:00",
    isActive: true,
  });

  const editStaff = staff.find((s) => s.id === editId) ?? null;
  const deleteStaffObj = staff.find((s) => s.id === deleteId) ?? null;

  function openCreate() {
    setEditId(null);
    setForm({
      name: "",
      role: "Therapist",
      specialization: "",
      commissionPct: "10",
      perDaySalary: "1000",
      startHour: "09:00",
      endHour: "18:00",
      isActive: true,
    });
    setOpen(true);
  }

  function openEdit(s: StaffDTO) {
    setEditId(s.id);
    const [startHour, endHour] = s.workingHours.split(" – ");
    setForm({
      name: s.name,
      role: s.role,
      specialization: s.specialization ?? "",
      commissionPct: String(s.commissionPct),
      perDaySalary: String(s.perDaySalary ?? 0),
      startHour: startHour ?? "09:00",
      endHour: endHour ?? "18:00",
      isActive: s.isActive,
    });
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name) {
      toast.error("Please fill name");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        specialization: form.specialization || undefined,
        commissionPct: parseInt(form.commissionPct, 10) || 0,
        perDaySalary: parseInt(form.perDaySalary, 10) || 0,
        startHour: form.startHour,
        endHour: form.endHour,
        isActive: form.isActive,
      };
      if (editId) {
        await updateStaff(editId, payload);
        toast.success("Staff updated");
      } else {
        await createStaff(payload);
        toast.success("Staff added");
      }
      setOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to save staff", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Staff Management</h1>
          <p className="text-[12.5px] text-[#7A6E66]">{staff.length} staff · {staff.filter((s) => s.isActive).length} active</p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => {
          const c = colorForName(s.name);
          return (
            <div key={s.id} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/60">
                  <AvatarFallback
                    className="text-[14px] font-bold"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    {initials(s.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-serif text-[16px] font-bold text-[#3D1F2B]">
                    {s.name}
                  </h3>
                  <span className="rounded-full bg-[#FBE4E2] px-2 py-0.5 text-[10.5px] font-medium text-[#B8456A]">
                    {s.role}
                  </span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[12px] text-[#7A6E66]">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  {s.specialization ?? "General"}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {s.workingHours}
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5" />
                  {s.commissionPct}% commission
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-3.5 w-3.5" />
                  ₹{(s.perDaySalary ?? 0).toLocaleString("en-IN")} per day salary
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#D9708A]/10 pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={async () => {
                      await toggleStaff(s.id);
                      toast.success(`Staff ${s.isActive ? "deactivated" : "activated"}`);
                      refresh();
                    }}
                  />
                  <span className="text-[11px] text-[#7A6E66]">
                    {s.isActive ? "Active" : "On Leave"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full hover:bg-[#FBE4E2]"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#7A6E66]" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full hover:bg-[#FBDDE0]"
                    onClick={() => setDeleteId(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#D9364B]" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[500px]">
          <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
                {editId ? "Edit Staff" : "Add New Staff"}
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#7A6E66]">
                Add therapists, receptionists or managers to your spa team.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aarti Kapoor"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v })}
              >
                <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                  <SelectItem value="Senior Therapist">Senior Therapist</SelectItem>
                  <SelectItem value="Therapist">Therapist</SelectItem>
                  <SelectItem value="Receptionist">Receptionist</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Specialization</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Aromatherapy"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Commission %</Label>
              <Input
                type="number"
                value={form.commissionPct}
                onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Per Day Salary (₹)</Label>
              <Input
                type="number"
                value={form.perDaySalary}
                onChange={(e) => setForm({ ...form, perDaySalary: e.target.value })}
                placeholder="1000"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Active</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(b) => setForm({ ...form, isActive: b })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Start Hour</Label>
              <Input
                type="time"
                value={form.startHour}
                onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">End Hour</Label>
              <Input
                type="time"
                value={form.endHour}
                onChange={(e) => setForm({ ...form, endHour: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={handleSubmit}
              className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
            >
              {saving ? "Saving…" : editId ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Staff
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete <span className="font-semibold text-[#1A1A1A]">{deleteStaffObj?.name}</span>?
              Past appointments will retain their reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await deleteStaff(deleteId);
                  toast.success("Staff deleted");
                  setDeleteId(null);
                  refresh();
                } catch (e) {
                  toast.error("Cannot delete staff with appointments", {
                    description: e instanceof Error ? e.message : "",
                  });
                }
              }}
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
