"use client";

import Image from "next/image";
import { useSpa, type ViewKey } from "./SpaShell";
import {
  Home,
  Users,
  Crown,
  CalendarCheck,
  Flower2,
  CreditCard,
  Gift,
  UserCog,
  BarChart3,
  Megaphone,
  Settings,
  ArrowRight,
  X,
  ClipboardList,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Lotus } from "./Lotus";

const NAV: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "daily-entries", label: "Daily Entries", icon: ClipboardList },
  { key: "members", label: "Members", icon: Users },
  { key: "plans", label: "Membership Plans", icon: Crown },
  { key: "appointments", label: "Appointments", icon: CalendarCheck },
  { key: "services", label: "Services", icon: Flower2 },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "packages", label: "Packages & Offers", icon: Gift },
  { key: "staff", label: "Staff Management", icon: UserCog },
  { key: "attendance", label: "Staff Attendance", icon: CalendarClock },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "settings", label: "Settings", icon: Settings },
];

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, setBookApptOpen } = useSpa();

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 8% 14%, rgba(120,40,70,0.34), transparent 38%), radial-gradient(circle at 96% 52%, rgba(95,30,62,0.32), transparent 42%), linear-gradient(180deg, #20101c 0%, #1a0b15 50%, #12070d 100%)",
      }}
    >
      {/* Logo */}
      <div className="relative flex flex-col items-center px-5 pb-5 pt-7 text-center">
        <Lotus className="h-[38px] w-[54px] text-[#F3D9DF]" strokeWidth={1.3} />
        <div className="font-display mt-2 text-[40px] font-medium leading-none tracking-tight text-white">
          Bella Luxe
        </div>
        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.42em] text-white/85">
          Day Spa
        </div>
        <p className="mt-3 text-[12.5px] tracking-wide text-white/85">
          Relax <span className="mx-1.5 text-white/60">•</span> Rejuvenate{" "}
          <span className="mx-1.5 text-white/60">•</span> Be You
        </p>
      </div>

      {/* Nav */}
      <nav className="sidebar-scroll relative flex-1 space-y-1 overflow-y-auto px-[18px] pb-4 pt-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                setView(item.key);
                onNavigate?.();
              }}
              className={cn(
                "group relative flex h-[42px] w-full items-center gap-3.5 rounded-xl px-3.5 text-left text-[15px] font-normal transition-all",
                active
                  ? "border border-white/20 bg-gradient-to-r from-[#a8445f] via-[#8f3556] to-[#6d2850] text-white shadow-[0_6px_18px_rgba(150,50,90,0.35)]"
                  : "border border-transparent text-white/90 hover:bg-white/[0.06]"
              )}
            >
              <Icon
                strokeWidth={1.6}
                className={cn("h-5 w-5", active && item.key === "dashboard" && "fill-white")}
              />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quote card over the candle / plumeria still-life */}
      <div className="relative h-[230px] shrink-0">
        <Image
          src="/spa/ref/sidebar-bottom.png"
          alt=""
          width={526}
          height={468}
          className="absolute inset-x-0 bottom-0 h-auto w-full"
        />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#12070d]/0 to-transparent" />
        <div className="relative mx-4 rounded-[26px] border border-white/15 bg-white/[0.05] px-5 pb-5 pt-6 backdrop-blur-[2px]">
          <p className="font-display text-[22px] italic leading-[1.25] text-white/95">
            Wellness
            <br />
            is a journey,
            <br />
            not a destination.
          </p>
          <button
            onClick={() => {
              setBookApptOpen(true);
              onNavigate?.();
            }}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-black/25 px-4 text-[13px] text-white/95 transition-colors hover:bg-[#8E4A63]"
          >
            Book a Session <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-[240px] shrink-0 lg:block">
      <div className="sticky top-0 h-screen">
        <SidebarInner />
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useSpa();
  if (!isMobileSidebarOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <div className="absolute left-0 top-0 h-full w-[280px] shadow-2xl">
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarInner onNavigate={() => setMobileSidebarOpen(false)} />
      </div>
    </div>
  );
}
