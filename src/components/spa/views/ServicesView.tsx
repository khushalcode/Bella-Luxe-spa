"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Clock, IndianRupee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { createService, updateService, toggleService, deleteService } from "@/app/actions/services";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import type { ServiceDTO } from "@/lib/types";

export function ServicesView() {
  const { services, setBookApptOpen, refresh } = useSpa();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Massage",
    durationMin: "60",
    price: "",
    isActive: true,
  });

  const editService = services.find((s) => s.id === editId) ?? null;
  const deleteServiceObj = services.find((s) => s.id === deleteId) ?? null;

  function openCreate() {
    setEditId(null);
    setForm({ name: "", category: "Massage", durationMin: "60", price: "", isActive: true });
    setOpen(true);
  }

  function openEdit(s: ServiceDTO) {
    setEditId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      durationMin: String(s.durationMin),
      price: String(s.price),
      isActive: s.isActive,
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
      const payload = {
        name: form.name,
        category: form.category,
        durationMin: parseInt(form.durationMin, 10) || 60,
        price: parseInt(form.price, 10),
        isActive: form.isActive,
      };
      if (editId) {
        await updateService(editId, payload);
        toast.success("Service updated");
      } else {
        await createService(payload);
        toast.success("Service created");
      }
      setOpen(false);
      refresh();
    } catch (e) {
      toast.error("Failed to save service", {
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
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Services</h1>
          <p className="text-[12.5px] text-[#7A6E66]">
            {services.length} services · {services.filter((s) => s.isActive).length} active
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Service
        </Button>
      </header>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#D9708A]/12 bg-[#F8F1E9]/40 hover:bg-transparent">
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Service</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Category</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Duration</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Price</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Active</TableHead>
              <TableHead className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow key={s.id} className="border-b border-[#D9708A]/8 hover:bg-[#FBE4E2]/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FBE4E2] text-[#B8456A]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-[#1A1A1A]">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-full bg-[#F1E5D8] px-2 py-0.5 text-[11px] font-medium text-[#7A6E66]">
                    {s.category}
                  </span>
                </TableCell>
                <TableCell className="text-[12.5px] text-[#7A6E66]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {s.durationMin} min
                  </span>
                </TableCell>
                <TableCell className="text-[12.5px] font-semibold text-[#3D1F2B]">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatINR(s.price).replace("₹", "")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={async () => {
                        await toggleService(s.id);
                        toast.success(`Service ${s.isActive ? "deactivated" : "activated"}`);
                        refresh();
                      }}
                    />
                    <span className="text-[11px] text-[#7A6E66]">
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="glass-card flex items-center justify-between p-4">
        <div>
          <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Need to book a session?</h3>
          <p className="text-[11.5px] text-[#7A6E66]">Book an appointment against any of your services.</p>
        </div>
        <Button
          onClick={() => setBookApptOpen(true)}
          className="h-9 rounded-full bg-[#3D1F2B] px-4 text-[12px] font-semibold text-white hover:bg-[#2B1620]"
        >
          Book Appointment
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[460px]">
          <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">
                {editId ? "Edit Service" : "Add New Service"}
              </DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#7A6E66]">
                Add a treatment to your spa catalogue.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Aromatherapy Massage"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                  <SelectItem value="Massage">Massage</SelectItem>
                  <SelectItem value="Facial">Facial</SelectItem>
                  <SelectItem value="Body">Body</SelectItem>
                  <SelectItem value="Hair">Hair</SelectItem>
                  <SelectItem value="Nails">Nails</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Duration (min)</Label>
              <Input
                type="number"
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="2500"
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
              {saving ? "Saving…" : editId ? "Save Changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete <span className="font-semibold text-[#1A1A1A]">{deleteServiceObj?.name}</span>?
              Past appointments will retain their reference but no new ones can use this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                try {
                  await deleteService(deleteId);
                  toast.success("Service deleted");
                  setDeleteId(null);
                  refresh();
                } catch (e) {
                  toast.error("Cannot delete service in use", {
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
