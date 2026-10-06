"use client";

import { useState } from "react";
import { Plus, Crown, Waves, Scale, Leaf, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { createPlan, updatePlan, togglePlan, deletePlan } from "@/app/actions/plans";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import type { PlanDTO } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  "Premium Glow": Crown,
  "Relax & Renew": Waves,
  "Body Balance": Scale,
  "Self-Care Plus": Leaf,
};

export function PlansView() {
  const { plans, refresh } = useSpa();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editPlan = plans.find((p) => p.id === editId) ?? null;
  const deletePlanObj = plans.find((p) => p.id === deleteId) ?? null;

  const [form, setForm] = useState({
    name: "",
    price: "",
    durationDays: "365",
    sessionsIncluded: "12",
    discountPct: "0",
    benefitsText: "",
  });

  function openCreate() {
    setEditId(null);
    setForm({
      name: "",
      price: "",
      durationDays: "365",
      sessionsIncluded: "12",
      discountPct: "0",
      benefitsText: "",
    });
    setOpen(true);
  }

  function openEdit(p: PlanDTO) {
    setEditId(p.id);
    setForm({
      name: p.name,
      price: String(p.price),
      durationDays: String(p.durationDays),
      sessionsIncluded: String(p.sessionsIncluded),
      discountPct: String(p.discountPct),
      benefitsText: p.benefits.join(", "),
    });
    setOpen(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.price) {
      toast.error("Please fill name and price");
      return;
    }
    setSaving(true);
    try {
      const benefits = form.benefitsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: form.name,
        price: parseInt(form.price, 10),
        durationDays: parseInt(form.durationDays, 10) || 365,
        sessionsIncluded: parseInt(form.sessionsIncluded, 10) || 12,
        discountPct: parseInt(form.discountPct, 10) || 0,
        benefits,
      };
      if (editId) {
        await updatePlan(editId, payload);
        toast.success("Plan updated");
      } else {
        await createPlan(payload);
        toast.success("Plan created");
      }
      setOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to save plan", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">
            Membership Plans
          </h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {plans.length} plans · {plans.reduce((s, p) => s + (p.memberCount ?? 0), 0)} active members
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((p) => {
          const Icon = ICONS[p.name] ?? Crown;
          return (
            <div
              key={p.id}
              className="glass-card relative flex flex-col p-5"
            >
              {!p.isActive && (
                <span className="absolute right-3 top-3 rounded-full bg-[#F1E5D8] px-2 py-0.5 text-[10px] font-semibold text-[#7A6E66]">
                  Inactive
                </span>
              )}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FBE4E2] to-[#F5D9DC] text-[#B8456A]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-serif text-[18px] font-bold text-[#3D1F2B]">
                {p.name}
              </h3>
              <div className="mt-1 text-[20px] font-bold text-[#B8456A]">
                {formatINR(p.price)}
                <span className="ml-1 text-[12px] font-medium text-[#7A6E66]">
                  / {p.durationDays}d
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11.5px] text-[#7A6E66]">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-[#2E9E6E]" />
                  {p.sessionsIncluded} sessions
                </span>
                <span className="flex items-center gap-1">
                  {p.discountPct}% off
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.benefits.slice(0, 4).map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-[#FBE4E2] px-2 py-0.5 text-[10.5px] font-medium text-[#B8456A]"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-white/55 px-3 py-2 text-[11.5px]">
                <span className="text-[#7A6E66]">Members:</span>
                <span className="font-semibold text-[#3D1F2B]">
                  {p.memberCount ?? 0}
                </span>
                <span className="ml-auto text-[#7A6E66]">Revenue:</span>
                <span className="font-semibold text-[#2E9E6E]">
                  {formatINR(p.revenue ?? 0)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#D9708A]/10 pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={async () => {
                      await togglePlan(p.id);
                      toast.success(`Plan ${p.isActive ? "deactivated" : "activated"}`);
                      refresh();
                    }}
                  />
                  <span className="text-[11px] text-[#7A6E66]">
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full hover:bg-[#FBE4E2]"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#7A6E66]" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full hover:bg-[#FBDDE0]"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#D9364B]" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[500px]">
          <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
                {editId ? "Edit Plan" : "Add New Plan"}
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#7A6E66]">
                Configure pricing, sessions and benefits.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Premium Glow"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Duration (days)</Label>
              <Input
                type="number"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Sessions Included</Label>
              <Input
                type="number"
                value={form.sessionsIncluded}
                onChange={(e) => setForm({ ...form, sessionsIncluded: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Discount %</Label>
              <Input
                type="number"
                value={form.discountPct}
                onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">
                Benefits (comma-separated)
              </Label>
              <Textarea
                value={form.benefitsText}
                onChange={(e) => setForm({ ...form, benefitsText: e.target.value })}
                placeholder="Aromatherapy, Facial Therapy, Body Scrub"
                className="min-h-[60px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
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
              {saving ? "Saving…" : editId ? "Save Changes" : "Add Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Plan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete <span className="font-semibold text-[#1A1A1A]">{deletePlanObj?.name}</span>?
              Existing memberships will not be affected, but no new memberships can use this plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await deletePlan(deleteId);
                  toast.success("Plan deleted");
                  setDeleteId(null);
                  refresh();
                } catch (e) {
                  toast.error("Cannot delete plan with active memberships", {
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
