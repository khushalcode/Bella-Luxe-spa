"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Menu, LogOut, X, UserRound, Phone, Hash } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpa } from "./SpaShell";
import { MemberAvatar } from "./MemberAvatar";
import { StatusPill } from "./Pills";
import { formatDate } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase";
import type { MemberDTO } from "@/lib/types";

/**
 * Quick member search popup. Searches by Name, Phone, or Membership ID.
 * Opens below the topbar search input as the user types. Clicking a
 * matching member opens the right-side MemberProfileSheet (via
 * openMember from the spa context).
 */
function QuickMemberSearch({
  query,
  onPick,
  onClose,
  align,
}: {
  query: string;
  onPick: (m: MemberDTO) => void;
  onClose: () => void;
  align: { left: number; top: number; width: number };
}) {
  const { members } = useSpa();
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return [] as MemberDTO[];
    return members
      .filter((m) => {
        return (
          m.name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          m.memberCode.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [members, q]);

  if (!q) return null;

  return (
    <>
      {/* click-away catcher */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 mt-1 max-h-[420px] overflow-y-auto rounded-2xl border border-[#D9708A]/15 bg-white shadow-[0_18px_48px_rgba(60,20,40,0.22)]"
        style={{
          left: align.left,
          top: align.top + 4,
          width: Math.max(align.width, 380),
        }}
      >
        <div className="flex items-center justify-between border-b border-[#D9708A]/10 px-4 py-2.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">
            {matches.length > 0
              ? `${matches.length} member${matches.length === 1 ? "" : "s"} matched`
              : "No matches"}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-[#7A6E66] hover:bg-[#FBE4E2]"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {matches.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <UserRound className="mx-auto mb-2 h-7 w-7 text-[#D9708A]/40" strokeWidth={1.5} />
            <p className="text-[12.5px] text-[#7A6E66]">
              No member found by name, phone or membership ID.
            </p>
            <p className="mt-1 text-[11px] text-[#9A8E84]">
              Try a different spelling or check the Members list.
            </p>
          </div>
        ) : (
          <ul className="py-1">
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => onPick(m)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#FBE4E2]/60"
                >
                  <MemberAvatar name={m.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-[#2a2430]">
                        {m.name}
                      </span>
                      <StatusPill status={m.membershipStatus} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11.5px] text-[#7A6E66]">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {m.memberCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {m.phone}
                      </span>
                      <span className="truncate">
                        {m.currentPlanName ?? "No active plan"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-[#7A6E66]">Expiry</div>
                    <div className="text-[11.5px] font-medium text-[#3D1F2B]">
                      {formatDate(m.membershipEnd)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function Topbar() {
  const { setMobileSidebarOpen, setView, openMember, members, userRole, userEmail, userName } = useSpa();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [align, setAlign] = useState({ left: 0, top: 0, width: 0 });

  // Popup is shown when search is non-empty.
  const searchOpen = search.trim().length > 0;

  // Recompute popup alignment on resize/scroll and when popup opens.
  useEffect(() => {
    function recompute() {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setAlign({ left: r.left, top: r.bottom, width: r.width });
    }
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [searchOpen]);

  // ⌘K / Ctrl+K focuses the search input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handlePick(m: MemberDTO) {
    openMember(m.id);
    setSearch("");
    inputRef.current?.blur();
  }

  function handleClose() {
    setSearch("");
  }

  // Total members count badge (informational)
  const totalMembers = members.length;

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabaseBrowser.auth.signOut();
      toast.success("You have been signed out.");
      // Hard reload to drop any in-memory role state and clear the auth cookies.
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (e) {
      setSigningOut(false);
      toast.error(e instanceof Error ? e.message : "Unable to sign out.");
    }
  }

  return (
    <header className="relative z-30 px-4 pb-2 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#8E4A63] shadow-sm lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div ref={wrapRef} className="relative w-full max-w-[560px] flex-1">
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#3a3340]" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick search: name, phone, or membership ID…"
            className="h-[42px] w-full rounded-xl border border-white bg-white/95 pl-11 pr-16 text-[13.5px] text-[#1F2937] shadow-[0_2px_10px_rgba(120,60,80,0.06)] outline-none placeholder:text-[#7a7480] focus:border-[#8E4A63]/40 focus:ring-2 focus:ring-[#8E4A63]/10"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-md border border-[#2D1B30]/10 bg-[#F3EEEE] px-2 py-0.5 text-[11px] font-medium text-[#6B6570] sm:inline-flex">
            ⌘ K
          </kbd>
          {searchOpen && (
            <QuickMemberSearch
              query={search}
              onPick={handlePick}
              onClose={handleClose}
              align={align}
            />
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(120,60,80,0.08)] hover:bg-[#FBE4E2]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px] text-[#2a2430]" />
            <span className="absolute -right-0.5 -top-0.5 flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-2xl bg-white/95 py-1.5 pl-1.5 pr-3 shadow-[0_2px_10px_rgba(120,60,80,0.08)] hover:bg-white">
                <Avatar className="h-[38px] w-[38px] border border-white">
                  <AvatarImage src="/spa/avatars/admin.jpg" alt={userName ?? "Admin"} />
                  <AvatarFallback className="bg-[#2D1B30] text-[11px] font-semibold text-[#F5D9DC]">
                    {(userName ?? "AD").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-[13px] font-semibold text-[#1F2937]">
                    {userName ?? (userEmail ? userEmail.split("@")[0] : "Admin")}
                  </span>
                  <span className="block text-[10.5px] font-medium uppercase tracking-wider text-[#8E4A63]">
                    {userRole} access
                  </span>
                </span>
                <ChevronDown className="hidden h-4 w-4 text-[#3a3340] md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-[#2D1B30]/10 bg-white"
            >
              <DropdownMenuLabel className="flex flex-col gap-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                <span className="text-[12.5px] font-semibold normal-case tracking-normal text-[#1F2937]">
                  {userName ?? "Spa Admin"}
                </span>
                <span className="text-[11px] font-normal normal-case text-[#6B7280]">
                  {userEmail ?? "Bella Luxe Day Spa"}
                </span>
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[#FBE4E2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8E4A63]">
                  {userRole}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2D1B30]/10" />
              <DropdownMenuItem onClick={() => setView("settings")} className="text-[12.5px]">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("settings")} className="text-[12.5px]">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView("members")} className="text-[12.5px]">
                Members ({totalMembers})
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2D1B30]/10" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={signingOut}
                className="text-[12.5px] text-[#EF4444] focus:text-[#EF4444]"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                {signingOut ? "Signing out…" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
