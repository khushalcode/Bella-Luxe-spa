"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Megaphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useSpa } from "../SpaShell";
import { ChannelPill, CampaignStatusPill } from "../Pills";
import { createCampaign, sendCampaign, deleteCampaign } from "@/app/actions/campaigns";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/format";

export function MarketingView() {
  const { campaigns, members, refresh } = useSpa();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const [toggles, setToggles] = useState({
    birthday: true,
    anniversary: false,
    renewal: true,
  });

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("bella-marketing-toggles") : null;
    if (saved) {
      try { setToggles(JSON.parse(saved)); } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bella-marketing-toggles", JSON.stringify(toggles));
    }
  }, [toggles]);

  const [form, setForm] = useState({
    name: "",
    channel: "WhatsApp",
    template: "",
    segment: "All Members",
  });

  const segments = [
    { name: "All Members", count: members.length },
    { name: "Active", count: members.filter((m) => m.membershipStatus === "Active").length },
    { name: "Expiring", count: members.filter((m) => m.membershipStatus === "Expiring Soon").length },
    { name: "Expired", count: members.filter((m) => m.membershipStatus === "Expired").length },
    { name: "Birthday This Month", count: members.filter((m) => {
      if (!m.dob) return false;
      const d = new Date(m.dob);
      return d.getMonth() === new Date().getMonth();
    }).length },
  ];

  const templates = [
    { channel: "WhatsApp", text: "🌸 Hi {name}, renew your membership today & get 25% off!" },
    { channel: "SMS", text: "Bella Luxe: Hi {name}, your appointment is confirmed for {date}." },
    { channel: "Email", text: "Dear {name}, we miss you at Bella Luxe. Here's ₹500 off your next visit." },
  ];

  const deleteCampaignObj = campaigns.find((c) => c.id === deleteId) ?? null;

  async function handleSubmit() {
    if (!form.name || !form.template) {
      toast.error("Please fill name and template");
      return;
    }
    setSaving(true);
    try {
      await createCampaign({
        name: form.name,
        channel: form.channel,
        template: form.template,
        segment: [form.segment],
      });
      toast.success("Campaign created");
      setOpen(false);
      setForm({ name: "", channel: "WhatsApp", template: "", segment: "All Members" });
      refresh();
    } catch (e) {
      toast.error("Failed to create campaign", {
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
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Marketing</h1>
          <p className="text-[12.5px] text-[#7A6E66]">{campaigns.length} campaigns · {campaigns.filter((c) => c.status === "Sent").length} sent</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Active Campaigns</h3>
          <div className="space-y-2.5">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-[#D9708A]/12 bg-white/60 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FBE4E2] text-[#B8456A]">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">{c.name}</div>
                  <div className="truncate text-[11px] text-[#7A6E66]">{c.template}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <ChannelPill channel={c.channel} />
                    <CampaignStatusPill status={c.status} />
                    {c.scheduledAt && (
                      <span className="text-[10.5px] text-[#7A6E66]">
                        Scheduled: {formatDateTime(c.scheduledAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {c.status !== "Sent" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-full border-[#D9708A]/30 text-[11.5px] font-semibold text-[#B8456A] hover:bg-[#FBE4E2]"
                      onClick={async () => {
                        await sendCampaign(c.id);
                        toast.success("Campaign sent");
                        refresh();
                      }}
                    >
                      <Send className="mr-1.5 h-3 w-3" /> Send Now
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full hover:bg-[#FBDDE0]"
                    onClick={() => setDeleteId(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#D9364B]" />
                  </Button>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="py-6 text-center text-[12px] text-[#7A6E66]">
                No campaigns yet. Click "New Campaign" to create one.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Reminder Automations</h3>
            <div className="space-y-3">
              {[
                { key: "birthday", label: "Birthday wishes", desc: "Auto SMS on member birthday" },
                { key: "anniversary", label: "Anniversary", desc: "Email on join anniversary" },
                { key: "renewal", label: "Renewal reminder", desc: "WhatsApp 7 days before expiry" },
              ].map((r) => (
                <div key={r.key} className="flex items-center justify-between rounded-lg bg-white/55 p-2.5">
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#1A1A1A]">{r.label}</div>
                    <div className="text-[10.5px] text-[#7A6E66]">{r.desc}</div>
                  </div>
                  <Switch
                    checked={(toggles as any)[r.key]}
                    onCheckedChange={(b) => setToggles({ ...toggles, [r.key]: b })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Segments</h3>
            <div className="space-y-1.5">
              {segments.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-lg bg-white/55 px-3 py-2 text-[12px]">
                  <span className="font-medium text-[#1A1A1A]">{s.name}</span>
                  <span className="font-semibold text-[#3D1F2B]">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Templates</h3>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewTemplate(t.text)}
                  className="rounded-full bg-[#FBE4E2] px-3 py-1 text-[11px] font-medium text-[#B8456A] hover:bg-[#F5D9DC]"
                >
                  {t.channel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-0 shadow-soft-lg sm:max-w-[520px]">
          <div className="border-b border-[#D9708A]/12 bg-gradient-to-r from-[#FBE4E2]/60 to-[#F8F1E9] px-6 py-5">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-serif text-[19px] font-bold text-[#3D1F2B]">New Campaign</DialogTitle>
              <DialogDescription className="text-[12.5px] text-[#7A6E66]">Schedule a new marketing campaign.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Diwali Renewal Push"
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#3D1F2B]">Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-[#3D1F2B]">Segment</Label>
                <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-[#D9708A]/15 bg-white">
                    {segments.map((s) => (
                      <SelectItem key={s.name} value={s.name}>{s.name} ({s.count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Template</Label>
              <Textarea
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                placeholder="Hi {name}, ..."
                className="min-h-[80px] rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-[#D9708A]/12 bg-[#F8F1E9]/40 px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full text-[#7A6E66] hover:bg-[#FBE4E2] hover:text-[#B8456A]">
              Cancel
            </Button>
            <Button
              disabled={saving}
              onClick={handleSubmit}
              className="rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[13px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
            >
              {saving ? "Creating…" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template preview */}
      <Dialog open={!!previewTemplate} onOpenChange={(b) => !b && setPreviewTemplate(null)}>
        <DialogContent className="rounded-2xl border-[#D9708A]/15 bg-white p-6 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[17px] font-bold text-[#3D1F2B]">Template Preview</DialogTitle>
            <DialogDescription className="text-[12px] text-[#7A6E66]">Sample message your members will receive.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 rounded-xl bg-[#F8F1E9] p-4">
            <p className="text-[13px] italic text-[#1A1A1A]">{previewTemplate}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(b) => !b && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#D9708A]/15 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[18px] text-[#3D1F2B]">Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-[#7A6E66]">
              Delete <span className="font-semibold text-[#1A1A1A]">{deleteCampaignObj?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteId) return;
                await deleteCampaign(deleteId);
                toast.success("Campaign deleted");
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
