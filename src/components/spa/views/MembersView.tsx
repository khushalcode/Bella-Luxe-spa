"use client";

import { useState } from "react";
import { Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecentMembers } from "../RecentMembers";
import { useSpa } from "../SpaShell";
import { EditMemberDialog } from "../dialogs/EditMemberDialog";
import { RenewMemberDialog } from "../dialogs/RenewMemberDialog";
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
import { deleteMember } from "@/app/actions/members";
import { toast } from "sonner";
import { exportCSV } from "@/lib/format";
import type { MemberDTO } from "@/lib/types";

export function MembersView() {
  const { members, setAddMemberOpen, refresh } = useSpa();
  const [editId, setEditId] = useState<string | null>(null);
  const [renewId, setRenewId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");

  const plans = Array.from(
    new Set(members.map((m) => m.currentPlanName).filter(Boolean))
  ) as string[];

  const filtered = members.filter((m) => {
    if (
      statusFilter !== "all" &&
      (m.membershipStatus ?? "").toLowerCase() !== statusFilter
    )
      return false;
    if (planFilter !== "all" && m.currentPlanName !== planFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.phone.toLowerCase().includes(q) &&
        !m.memberCode.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const editMember = members.find((m) => m.id === editId) ?? null;
  const renewMember = members.find((m) => m.id === renewId) ?? null;
  const deleteMember_ = members.find((m) => m.id === deleteId) ?? null;

  function handleExport() {
    const rows: Record<string, unknown>[] = filtered.map((m: MemberDTO, i) => ({
      "#": i + 1,
      Code: m.memberCode,
      Name: m.name,
      Phone: m.phone,
      Email: m.email ?? "",
      Plan: m.currentPlanName ?? "",
      Status: m.membershipStatus ?? "",
      Start: m.membershipStart ?? "",
      Expiry: m.membershipEnd ?? "",
      Amount: m.amountPaid ?? 0,
    }));
    exportCSV("bella-luxe-members.csv", rows);
    toast.success("Members exported", { description: `${rows.length} rows downloaded.` });
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">
            Members
          </h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {members.length} total · {filtered.length} shown
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="h-10 rounded-full border-[#D9708A]/25 bg-white/70 text-[12.5px] font-semibold text-[#3D1F2B] hover:bg-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => setAddMemberOpen(true)}
            className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Member
          </Button>
        </div>
      </header>

      <div className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6E66]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or code…"
            className="h-10 rounded-full border-[#D9708A]/15 bg-white pl-10 text-[12.5px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full rounded-full border-[#D9708A]/15 bg-white text-[12.5px] md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring soon">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-10 w-full rounded-full border-[#D9708A]/15 bg-white text-[12.5px] md:w-[180px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#D9708A]/15 bg-white">
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RecentMembers
        onEdit={(id) => setEditId(id)}
        onRenew={(id) => setRenewId(id)}
        onDelete={(id) => setDeleteId(id)}
      />

      <EditMemberDialog
        member={editMember}
        open={!!editId}
        onOpenChange={(b) => !b && setEditId(null)}
      />
      <RenewMemberDialog
        member={renewMember}
        open={!!renewId}
        onOpenChange={(b) => !b && setRenewId(null)}
      />
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(b) => !b && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1A1A1A]">
                {deleteMember_?.name}
              </span>
              ? This action cannot be undone and will also delete all their
              memberships, appointments and payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                await deleteMember(deleteId);
                toast.success("Member deleted");
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
