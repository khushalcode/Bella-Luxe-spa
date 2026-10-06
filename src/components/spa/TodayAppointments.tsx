"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CheckCircle2,
  CircleSlash,
  MoreHorizontal,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useSpa } from "./SpaShell";
import { MemberAvatar } from "./MemberAvatar";
import { formatTime } from "@/lib/format";
import { updateAppointmentStatus, deleteAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Dashboard wording: a "Booked" slot is shown as "Confirmed".
function apptPill(status: string) {
  if (status === "Booked" || status === "Confirmed")
    return { label: "Confirmed", cls: "bg-[#E2F4E9] text-[#2F8F5B] ring-[#2F8F5B]/10" };
  if (status === "Pending")
    return { label: "Pending", cls: "bg-[#FDE4BE] text-[#D9780F] ring-[#D9780F]/15" };
  if (status === "Completed")
    return { label: "Completed", cls: "bg-[#E2F4E9] text-[#2F8F5B] ring-[#2F8F5B]/10" };
  if (status === "Cancelled")
    return { label: "Cancelled", cls: "bg-[#FCDDE6] text-[#E0305F] ring-[#E0305F]/10" };
  if (status === "No-show")
    return { label: "No-show", cls: "bg-[#FDE4BE] text-[#D9780F] ring-[#D9780F]/15" };
  return { label: status, cls: "bg-[#F1E5D8] text-[#7A6E66] ring-transparent" };
}

export function TodayAppointments() {
  const { summary, refresh, setView } = useSpa();
  const list = summary.todaysAppointments;

  return (
    <div className="glass-card px-5 pb-4 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <CalendarCheck className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Today&apos;s Appointments
        </h3>
        <button
          onClick={() => setView("appointments")}
          className="flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-[#7a2a55] hover:text-[#5d1f40]"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div>
        {list.map((a) => {
          const pill = apptPill(a.status);
          return (
            <div
              key={a.id}
              className="group relative flex h-[40px] items-center gap-3 border-b border-[#2D1B30]/[0.06] last:border-0"
            >
              <span className="w-[60px] shrink-0 text-[12px] text-[#2a2430]">
                {formatTime(a.startsAt)}
              </span>
              <MemberAvatar name={a.memberName ?? ""} size={32} />
              <span className="w-[78px] shrink-0 truncate text-[12.5px] font-medium text-[#2a2430]">
                {a.memberName}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-[#6B6570]">
                {a.serviceName}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-[11.5px] font-medium leading-none ring-1",
                  pill.cls
                )}
              >
                {pill.label}
              </span>

              {/* row actions: revealed on hover so the card matches the design */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white/90 shadow-sm hover:bg-[#FBE4E2]"
                    >
                      <MoreHorizontal className="h-4 w-4 text-[#3a3340]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-44 rounded-xl border-[#D9708A]/15 bg-white"
                  >
                    <DropdownMenuItem
                      onClick={async () => {
                        await updateAppointmentStatus(a.id, "Completed");
                        toast.success("Appointment marked as completed");
                        refresh();
                      }}
                      className="text-[12.5px]"
                    >
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await updateAppointmentStatus(a.id, "No-show");
                        toast.success("Marked as no-show");
                        refresh();
                      }}
                      className="text-[12.5px]"
                    >
                      <CircleSlash className="mr-2 h-3.5 w-3.5" /> Mark No-show
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await updateAppointmentStatus(a.id, "Cancelled");
                        toast.success("Appointment cancelled");
                        refresh();
                      }}
                      className="text-[12.5px]"
                    >
                      <CircleSlash className="mr-2 h-3.5 w-3.5" /> Cancel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#D9708A]/15" />
                    <DropdownMenuItem
                      onClick={async () => {
                        await deleteAppointment(a.id);
                        toast.success("Appointment deleted");
                        refresh();
                      }}
                      className="text-[12.5px] text-[#D9364B] focus:text-[#D9364B]"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="py-6 text-center text-[12px] text-[#7A6E66]">
            No appointments today.
          </div>
        )}
      </div>
    </div>
  );
}
