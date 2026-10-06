"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Moon, Sun } from "lucide-react";
import { useSpa } from "../SpaShell";
import { toast } from "sonner";

function loadSaved() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("bella-settings");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function SettingsView() {
  const { view } = useSpa();
  void view;

  const saved = typeof window !== "undefined" ? loadSaved() : null;

  const [profile, setProfile] = useState(saved?.profile ?? {
    name: "Bella Luxe Day Spa",
    address: "SCO 1024, Sector 8B, Chandigarh, 160009",
    phone: "+91 172 5000 100",
    gst: "04ABCDE1234F1Z5",
  });

  const [theme, setTheme] = useState<"light" | "dark">(saved?.theme ?? "light");
  const [notifRules, setNotifRules] = useState(saved?.notifRules ?? {
    days30: true,
    days7: true,
    days1: false,
    birthdayAuto: true,
  });

  function save() {
    if (typeof window !== "undefined") {
      localStorage.setItem("bella-settings", JSON.stringify({ profile, notifRules, theme }));
    }
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header>
        <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Settings</h1>
        <p className="text-[12.5px] text-[#7A6E66]">Configure your spa business profile & automations.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Business profile */}
        <div className="glass-card p-5">
          <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Business Profile</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Business Name</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Address</Label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Phone</Label>
              <Input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">GSTIN</Label>
              <Input
                value={profile.gst}
                onChange={(e) => setProfile({ ...profile, gst: e.target.value })}
                className="h-10 rounded-lg border-[#D9708A]/15 bg-white text-[13px]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-medium text-[#3D1F2B]">Logo Upload</Label>
              <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-[#D9708A]/25 bg-[#FBE4E2]/30 text-[11.5px] text-[#7A6E66]">
                Drop a logo here (visual only)
              </div>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">Branches</h3>
            <Button size="sm" variant="outline" className="h-7 rounded-full border-[#D9708A]/30 text-[11px] text-[#B8456A]">
              <Plus className="mr-1 h-3 w-3" /> Add Branch
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-white/55 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3D1F2B] text-[#C9A86A]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Chandigarh — Sector 8</div>
                <div className="text-[11px] text-[#7A6E66]">Main branch</div>
              </div>
              <span className="rounded-full bg-[#DDF3E8] px-2 py-0.5 text-[10.5px] font-semibold text-[#2E9E6E]">Active</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/55 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3D1F2B] text-[#C9A86A]">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">Mohali — Phase 5</div>
                <div className="text-[11px] text-[#7A6E66]">Satellite branch</div>
              </div>
              <span className="rounded-full bg-[#FCE8CF] px-2 py-0.5 text-[10.5px] font-semibold text-[#E08A2E]">Onboarding</span>
            </div>
          </div>
        </div>

        {/* Roles & permissions */}
        <div className="glass-card p-5">
          <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Roles &amp; Permissions</h3>
          <div className="overflow-hidden rounded-xl border border-[#D9708A]/12">
            <table className="w-full text-[11.5px]">
              <thead className="bg-[#F8F1E9]/60">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold uppercase tracking-wider text-[#7A6E66]">Role</th>
                  <th className="px-2 py-2 text-center font-semibold uppercase tracking-wider text-[#7A6E66]">Members</th>
                  <th className="px-2 py-2 text-center font-semibold uppercase tracking-wider text-[#7A6E66]">Payments</th>
                  <th className="px-2 py-2 text-center font-semibold uppercase tracking-wider text-[#7A6E66]">Reports</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Admin", members: true, payments: true, reports: true },
                  { role: "Manager", members: true, payments: true, reports: true },
                  { role: "Receptionist", members: true, payments: false, reports: false },
                  { role: "Therapist", members: false, payments: false, reports: false },
                ].map((r) => (
                  <tr key={r.role} className="border-t border-[#D9708A]/8">
                    <td className="px-2 py-2 font-medium text-[#1A1A1A]">{r.role}</td>
                    <td className="px-2 py-2 text-center">
                      <Switch defaultChecked={r.members} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Switch defaultChecked={r.payments} />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Switch defaultChecked={r.reports} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications + theme */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Notification Rules</h3>
            <div className="space-y-3">
              {[
                { key: "days30", label: "30 days before expiry", desc: "Email reminder" },
                { key: "days7", label: "7 days before expiry", desc: "WhatsApp reminder" },
                { key: "days1", label: "1 day before expiry", desc: "SMS reminder" },
                { key: "birthdayAuto", label: "Birthday auto-message", desc: "WhatsApp on birthday" },
              ].map((r) => (
                <div key={r.key} className="flex items-center justify-between rounded-lg bg-white/55 p-2.5">
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#1A1A1A]">{r.label}</div>
                    <div className="text-[10.5px] text-[#7A6E66]">{r.desc}</div>
                  </div>
                  <Switch
                    checked={(notifRules as any)[r.key]}
                    onCheckedChange={(b) => setNotifRules({ ...notifRules, [r.key]: b })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-3 font-serif text-[15px] font-bold text-[#3D1F2B]">Theme</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[12px] font-semibold ${
                  theme === "light" ? "bg-[#D9708A] text-white" : "bg-white/60 text-[#7A6E66]"
                }`}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[12px] font-semibold ${
                  theme === "dark" ? "bg-[#D9708A] text-white" : "bg-white/60 text-[#7A6E66]"
                }`}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
            <p className="mt-2 text-[10.5px] text-[#7A6E66]">Visual only — current theme is always applied.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-6 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
        >
          Save Settings
        </Button>
      </div>
    </div>
  );
}
