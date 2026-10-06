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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSpa } from "../SpaShell";
import { renewMembership } from "@/app/actions/members";
import { toast } from "sonner";
import type { MemberDTO } from "@/lib/types";

export function RenewMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: MemberDTO | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { plans, refresh } = useSpa();
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  useEffect(() => {
    if (member?.currentPlanId) setPlanId(member.currentPlanId);
    else if (plans[0]) setPlanId(plans[0].id);
    setAmountPaid("");
  }, [member, plans]);

  async function handleRenew() {
    if (!member || !planId) return;
    setSaving(true);
    try {
      const r = await renewMembership(
        member.id,
        planId,
        amountPaid ? parseInt(amountPaid, 10) : undefined
      );
      toast.success("Membership renewed", {
        description: `Invoice ${r.invoiceNo} generated for ${member.name}.`,
      });
      onOpenChange(false);
      refresh();
    } catch (e) {
      toast.error("Failed to renew membership", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[460px]">
        <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
              Renew Membership
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-[#7A6E66]">
              {member?.name} ({member?.memberCode}) — a new invoice will be
              generated automatically.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">
              Choose Plan
            </Label>
            <Select value={planId} onValueChange={setPlanId}>
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#3D1F2B]">
              Amount Paid (₹) — optional
            </Label>
            <Input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Auto-filled from plan price"
              className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
            />
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
            onClick={handleRenew}
            className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            {saving ? "Renewing…" : "Renew Membership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
