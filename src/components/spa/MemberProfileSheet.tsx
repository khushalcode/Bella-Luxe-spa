"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  CalendarDays,
  Cake,
  CreditCard,
  IndianRupee,
  Clock,
  Stethoscope,
  StickyNote,
  Pencil,
  RefreshCw,
  Bell,
  X,
} from "lucide-react";
import { useSpa } from "./SpaShell";
import { colorForName, formatDate, formatDateTime, formatINR, initials } from "@/lib/format";
import { StatusPill, PayStatusPill } from "./Pills";
import { sendReminder } from "@/app/actions/members";
import { toast } from "sonner";
import type { MemberDTO, MembershipDTO, PaymentDTO, AppointmentDTO } from "@/lib/types";

interface FullMember extends MemberDTO {
  memberships: (MembershipDTO & { planName?: string })[];
  appointments: AppointmentDTO[];
  payments: PaymentDTO[];
}

export function MemberProfileSheet({
  onEdit,
  onRenew,
}: {
  onEdit?: (memberId: string) => void;
  onRenew?: (memberId: string) => void;
}) {
  const { selectedMemberId, closeMember } = useSpa();
  return (
    <Sheet open={!!selectedMemberId} onOpenChange={(o) => !o && closeMember()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-[#D9708A]/15 bg-[#F8F1E9] p-0 sm:max-w-[480px]"
      >
        {selectedMemberId && (
          <MemberProfileSheetInner
            key={selectedMemberId}
            memberId={selectedMemberId}
            onEdit={onEdit}
            onRenew={onRenew}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function MemberProfileSheetInner({
  memberId,
  onEdit,
  onRenew,
}: {
  memberId: string;
  onEdit?: (memberId: string) => void;
  onRenew?: (memberId: string) => void;
}) {
  const { members, refresh, closeMember } = useSpa();
  const [member, setMember] = useState<FullMember | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/members/${memberId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setMember(d);
      })
      .catch(() => {
        if (!cancelled) setMember(null);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const fallback: MemberDTO | undefined = members.find((m) => m.id === memberId);
  const live: MemberDTO | null = member ?? fallback ?? null;

  return (
    <>
      {live && (
        <>
          {/* Hero header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#3D1F2B] via-[#5B2C3F] to-[#3D1F2B] px-6 pb-6 pt-6 text-white">
            <button
              onClick={closeMember}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, rgba(217,112,138,0.4) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(201,168,106,0.3) 0%, transparent 45%)",
              }}
            />
            <div className="relative flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/20">
                <AvatarFallback
                  className="text-[18px] font-bold"
                  style={{
                    background: colorForName(live.name).bg,
                    color: colorForName(live.name).fg,
                  }}
                >
                  {initials(live.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="font-serif text-[22px] font-bold text-white">
                  {live.name}
                </SheetTitle>
                <SheetDescription className="text-[12px] text-white/70">
                  {live.memberCode} · Joined {formatDate(live.createdAt)}
                </SheetDescription>
                <div className="mt-2">
                  <StatusPill status={live.membershipStatus} />
                </div>
              </div>
            </div>
          </div>

          <SheetHeader className="sr-only">
            <SheetTitle>{live.name}</SheetTitle>
            <SheetDescription>Member profile</SheetDescription>
          </SheetHeader>

          {/* Contact */}
          <Section title="Contact Information">
            <div className="grid grid-cols-1 gap-2.5">
              <Row icon={Phone} label="Phone" value={live.phone} />
              <Row icon={Mail} label="Email" value={live.email ?? "—"} />
              <Row icon={Cake} label="Date of Birth" value={formatDate(live.dob)} />
              <Row icon={Stethoscope} label="Gender" value={live.gender} />
              {live.address && (
                <Row icon={StickyNote} label="Address" value={live.address} />
              )}
            </div>
          </Section>

          {/* Membership */}
          <Section title="Current Membership">
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={CreditCard} label="Plan" value={live.currentPlanName ?? "—"} />
              <Stat icon={IndianRupee} label="Amount Paid" value={formatINR(live.amountPaid ?? 0)} />
              <Stat icon={CalendarDays} label="Start Date" value={formatDate(live.membershipStart)} />
              <Stat
                icon={Clock}
                label="Expiry Date"
                value={formatDate(live.membershipEnd)}
                highlight={
                  live.membershipStatus === "Expired" ||
                  live.membershipStatus === "Expiring Soon"
                }
              />
            </div>
          </Section>

          {/* Plan history */}
          {member && (
            <Section title={`Plan History (${member.memberships.length})`}>
              <div className="space-y-2">
                {member.memberships.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-[#D9708A]/12 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[12.5px] font-semibold text-[#1A1A1A]">
                        {m.planName}
                      </div>
                      <StatusPill status={m.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#7A6E66]">
                      <span>
                        {formatDate(m.startDate)} → {formatDate(m.endDate)}
                      </span>
                      <span className="font-semibold text-[#3D1F2B]">
                        {formatINR(m.amountPaid)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recent payments */}
          {member && member.payments.length > 0 && (
            <Section title={`Recent Payments (${member.payments.length})`}>
              <div className="space-y-2">
                {member.payments.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-[#D9708A]/12 bg-white p-3"
                  >
                    <div>
                      <div className="text-[12.5px] font-semibold text-[#1A1A1A]">
                        {p.invoiceNo}
                      </div>
                      <div className="text-[10.5px] text-[#7A6E66]">
                        {p.method} · {formatDateTime(p.paidAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12.5px] font-semibold text-[#3D1F2B]">
                        {formatINR(p.amount)}
                      </div>
                      <PayStatusPill status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Recent appointments */}
          {member && member.appointments.length > 0 && (
            <Section title={`Recent Appointments (${member.appointments.length})`}>
              <div className="space-y-2">
                {member.appointments.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-[#D9708A]/12 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[12.5px] font-semibold text-[#1A1A1A]">
                        {a.serviceName}
                      </div>
                      <span className="rounded-full bg-[#F1E5D8] px-2 py-0.5 text-[10.5px] font-semibold text-[#7A6E66]">
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-1 text-[10.5px] text-[#7A6E66]">
                      {formatDateTime(a.startsAt)} · {a.staffName ?? "Auto-assigned"}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {live.notes && (
            <Section title="Notes">
              <div className="flex gap-3 rounded-xl border border-[#D9708A]/12 bg-white p-3">
                <StickyNote className="h-4 w-4 shrink-0 text-[#D9708A]" />
                <p className="text-[12.5px] leading-relaxed text-[#1A1A1A]">
                  {live.notes}
                </p>
              </div>
            </Section>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 flex gap-2 border-t border-[#D9708A]/15 bg-white px-6 py-4">
            <Button
              variant="outline"
              onClick={() => live && onEdit?.(live.id)}
              className="flex-1 rounded-full border-[#D9708A]/30 text-[12.5px] font-semibold text-[#3D1F2B] hover:border-[#D9708A] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => live && onRenew?.(live.id)}
              className="flex-1 rounded-full border-[#D9708A]/30 text-[12.5px] font-semibold text-[#3D1F2B] hover:border-[#D9708A] hover:bg-[#FBE4E2] hover:text-[#B8456A]"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Renew
            </Button>
            <Button
              onClick={async () => {
                if (!live) return;
                const r = await sendReminder(live.id);
                toast.success(`Reminder sent to ${r.name}`);
                refresh();
              }}
              className="flex-1 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
            >
              <Bell className="mr-1.5 h-3.5 w-3.5" /> Remind
            </Button>
          </div>
        </>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4">
      <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#7A6E66]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#D9708A]/12 bg-white px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBE4E2]">
        <Icon className="h-4 w-4 text-[#B8456A]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] uppercase tracking-wider text-[#9A8E84]">
          {label}
        </div>
        <div className="truncate text-[13px] font-medium text-[#1A1A1A]">
          {value}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#D9708A]/12 bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#B8456A]" />
        <span className="text-[10.5px] uppercase tracking-wider text-[#9A8E84]">
          {label}
        </span>
      </div>
      <div
        className={`mt-1.5 text-[14px] font-semibold ${
          highlight ? "text-[#D9364B]" : "text-[#1A1A1A]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
