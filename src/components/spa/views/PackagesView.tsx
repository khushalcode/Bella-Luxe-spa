"use client";

import { useState } from "react";
import { Plus, Trash2, Gift, Calendar } from "lucide-react";
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
import { createPackage, togglePackage, deletePackage } from "@/app/actions/packages";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

export function PackagesView() {
  const { packages, refresh } = useSpa();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "Festive Offer",
    discountValue: "10",
    discountType: "percent",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    code: "",
  });

  const deletePkg = packages.find((p) => p.id === deleteId) ?? null;

  async function handleSubmit() {
    if (!form.title || !form.code) {
      toast.error("Please fill title and code");
      return;
    }
    setSaving(true);
    try {
      await createPackage({
        title: form.title,
        type: form.type,
        discountValue: parseInt(form.discountValue, 10) || 0,
        discountType: form.discountType,
        validFrom: form.validFrom,
        validTo: form.validTo,
        code: form.code.toUpperCase(),
      });
      toast.success("Package created");
      setOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to create package", {
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
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">
            Packages &amp; Offers
          </h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {packages.length} offers · {packages.filter((p) => p.isActive).length} active
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Package
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((p) => (
          <div key={p.id} className="glass-card relative overflow-hidden p-5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-[#FBE4E2]/60 to-transparent" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#D9708A] to-[#B8456A] text-white">
                  <Gift className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#F1E5D8] px-2 py-0.5 text-[10.5px] font-medium text-[#7A6E66]">
                  {p.type}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-[18px] font-bold text-[#3D1F2B]">
                {p.title}
              </h3>
              <div className="mt-1 text-[22px] font-bold text-[#B8456A]">
                {p.discountType === "percent"
                  ? `${p.discountValue}% OFF`
                  : `₹${p.discountValue} OFF`}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#3D1F2B] px-3 py-1 font-mono text-[11.5px] font-semibold text-[#C9A86A]">
                {p.code}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[#7A6E66]">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(p.validFrom)} → {formatDate(p.validTo)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[#D9708A]/10 pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.isActive}
                    onCheckedChange={async () => {
                      await togglePackage(p.id);
                      toast.success(`Package ${p.isActive ? "deactivated" : "activated"}`);
                      refresh();
                    }}
                  />
                  <span className="text-[11px] text-[#7A6E66]">
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
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
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[460px]">
          <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
                Add Package / Offer
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#7A6E66]">
                Create a new festive offer, bundle or coupon.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Diwali Glow"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                  <SelectItem value="Festive Offer">Festive Offer</SelectItem>
                  <SelectItem value="Bundle">Bundle</SelectItem>
                  <SelectItem value="Coupon">Coupon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="DIWALI25"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white font-mono text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Discount</Label>
              <Input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => setForm({ ...form, discountType: v })}
              >
                <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="amount">Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Valid From</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Valid To</Label>
              <Input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
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
              {saving ? "Creating…" : "Add Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Package
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete <span className="font-semibold text-[#1A1A1A]">{deletePkg?.title}</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                await deletePackage(deleteId);
                toast.success("Package deleted");
                setDeleteId(null);
                refresh();
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
