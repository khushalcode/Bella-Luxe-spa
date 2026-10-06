"use client";

import { cn } from "@/lib/utils";

export function StatusPill({
  status,
  className,
}: {
  status: string | null | undefined;
  className?: string;
}) {
  const s = (status ?? "").toLowerCase();
  let cls = "bg-[#F1E5D8] text-[#7A6E66]";
  if (s === "active") cls = "bg-[#E2F4E9] text-[#2F8F5B] ring-1 ring-[#2F8F5B]/10";
  else if (s === "expiring soon")
    cls = "bg-[#FDEBD3] text-[#D9780F] ring-1 ring-[#D9780F]/15";
  else if (s === "expired") cls = "bg-[#FCDDE6] text-[#E0305F] ring-1 ring-[#E0305F]/10";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1 text-[12px] font-medium leading-none",
        cls,
        className
      )}
    >
      {status ?? "—"}
    </span>
  );
}

export function MethodPill({ method }: { method: string }) {
  let cls = "bg-[#F1E5D8] text-[#7A6E66]";
  if (method === "UPI") cls = "bg-[#DDF3E8] text-[#2E9E6E]";
  else if (method === "Card") cls = "bg-[#F5D9DC] text-[#B8456A]";
  else if (method === "Cash") cls = "bg-[#FCE8CF] text-[#E08A2E]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      {method}
    </span>
  );
}

export function PayStatusPill({ status }: { status: string }) {
  let cls = "bg-[#F1E5D8] text-[#7A6E66]";
  if (status === "Paid") cls = "bg-[#DDF3E8] text-[#2E9E6E]";
  else if (status === "Pending") cls = "bg-[#FCE8CF] text-[#E08A2E]";
  else if (status === "Refunded") cls = "bg-[#FBDDE0] text-[#D9364B]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      {status}
    </span>
  );
}

export function ApptStatusPill({ status }: { status: string }) {
  let cls = "bg-[#F5D9DC] text-[#B8456A]";
  if (status === "Completed") cls = "bg-[#DDF3E8] text-[#2E9E6E]";
  else if (status === "Cancelled") cls = "bg-[#FBDDE0] text-[#D9364B]";
  else if (status === "No-show") cls = "bg-[#FCE8CF] text-[#E08A2E]";
  else if (status === "Booked") cls = "bg-[#F5D9DC] text-[#B8456A]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      {status}
    </span>
  );
}

export function ChannelPill({ channel }: { channel: string }) {
  let cls = "bg-[#F5D9DC] text-[#B8456A]";
  if (channel === "WhatsApp") cls = "bg-[#DDF3E8] text-[#2E9E6E]";
  else if (channel === "SMS") cls = "bg-[#FCE8CF] text-[#E08A2E]";
  else if (channel === "Email") cls = "bg-[#EFE3F4] text-[#8B5CA6]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      {channel}
    </span>
  );
}

export function CampaignStatusPill({ status }: { status: string }) {
  let cls = "bg-[#F1E5D8] text-[#7A6E66]";
  if (status === "Sent") cls = "bg-[#DDF3E8] text-[#2E9E6E]";
  else if (status === "Scheduled") cls = "bg-[#F5D9DC] text-[#B8456A]";
  else if (status === "Draft") cls = "bg-[#F1E5D8] text-[#7A6E66]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        cls
      )}
    >
      {status}
    </span>
  );
}
