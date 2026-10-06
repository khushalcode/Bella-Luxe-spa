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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSpa } from "./SpaShell";
import { createPayment } from "@/app/actions/payments";
import { toast } from "sonner";

export function CreateInvoiceDialog() {
  const { isCreateInvoiceOpen, setCreateInvoiceOpen, members, refresh } = useSpa();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    memberId: "",
    amount: "",
    method: "UPI",
  });

  function reset() {
    setForm({ memberId: "", amount: "", method: "UPI" });
  }

  async function handleSubmit() {
    if (!form.memberId || !form.amount) {
      toast.error("Please choose a member and enter an amount");
      return;
    }
    setSaving(true);
    try {
      const r = await createPayment({
        memberId: form.memberId,
        amount: parseInt(form.amount, 10),
        method: form.method,
      });
      toast.success("Payment recorded", {
        description: `Invoice ${r.invoiceNo} created.`,
      });
      reset();
      setCreateInvoiceOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to create invoice", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isCreateInvoiceOpen}
      onOpenChange={(o) => {
        setCreateInvoiceOpen(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[440px]">
        <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
              Create Invoice
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              Record a manual payment against a member.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
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
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Amount (₹)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1500"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">Method</Label>
            <Select
              value={form.method}
              onValueChange={(v) => setForm({ ...form, method: v })}
            >
              <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setCreateInvoiceOpen(false)}
            className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
          >
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            {saving ? "Recording…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
