"use client";

import { useState } from "react";
import { Plus, CalendarDays, Calendar, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSpa } from "../SpaShell";
import { ApptStatusPill } from "../Pills";
import { colorForName, formatTime, formatDateTime, initials } from "@/lib/format";
import { updateAppointmentStatus, deleteAppointment } from "@/app/actions/appointments";
import { toast } from "sonner";
import { CheckCircle2, CircleSlash, Trash2, MoreHorizontal } from "lucide-react";

export function AppointmentsView() {
  const { appointments, setBookApptOpen, refresh } = useSpa();
  const [tab, setTab] = useState("day");

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(today)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const monthEnd = new Date(today)
  monthEnd.setMonth(monthEnd.getMonth() + 1)

  const filtered = appointments.filter((a) => {
    const d = new Date(a.startsAt)
    if (tab === "day") return d >= today && d < tomorrowEnd
    if (tab === "week") return d >= today && d < weekEnd
    if (tab === "month") return d >= today && d < monthEnd
    return true
  })

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Appointments</h1>
          <p className="text-[12.5px] text-[#7A6E66]">{filtered.length} scheduled</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="rounded-full bg-white/70 p-1">
              <TabsTrigger value="day" className="rounded-full px-3 text-[12px] data-[state=active]:bg-[#D9708A] data-[state=active]:text-white">
                <CalendarDays className="mr-1 h-3.5 w-3.5" /> Day
              </TabsTrigger>
              <TabsTrigger value="week" className="rounded-full px-3 text-[12px] data-[state=active]:bg-[#D9708A] data-[state=active]:text-white">
                <Calendar className="mr-1 h-3.5 w-3.5" /> Week
              </TabsTrigger>
              <TabsTrigger value="month" className="rounded-full px-3 text-[12px] data-[state=active]:bg-[#D9708A] data-[state=active]:text-white">
                <CalendarRange className="mr-1 h-3.5 w-3.5" /> Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={() => setBookApptOpen(true)}
            className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            <Plus className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        </div>
      </header>

      <div className="glass-card divide-y divide-[#D9708A]/8">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12.5px] text-[#7A6E66]">
            No appointments scheduled.
          </div>
        )}
        {filtered.map((a) => {
          const c = colorForName(a.memberName ?? "")
          return (
            <div
              key={a.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-14 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-[#3D1F2B] to-[#5B2C3F] text-white">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#C9A86A]">
                    {new Date(a.startsAt).toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                  <span className="text-[13px] font-bold leading-none">
                    {formatTime(a.startsAt).split(" ")[0]}
                  </span>
                </div>
                <Avatar className="h-10 w-10 border border-white/60">
                  <AvatarFallback
                    className="text-[12px] font-bold"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    {initials(a.memberName ?? "")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">
                  {a.memberName}
                </div>
                <div className="text-[11.5px] text-[#7A6E66]">
                  {a.serviceName} · {a.staffName ?? "Auto-assigned"}
                </div>
                <div className="mt-0.5 text-[10.5px] text-[#7A6E66]/80">
                  {formatDateTime(a.startsAt)}
                </div>
              </div>
              <ApptStatusPill status={a.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-[#FBE4E2]"
                  >
                    <MoreHorizontal className="h-4 w-4 text-[#7A6E66]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border-[#D9708A]/15 bg-white">
                  <DropdownMenuItem
                    onClick={async () => {
                      await updateAppointmentStatus(a.id, "Completed")
                      toast.success("Appointment marked as completed")
                      refresh()
                    }}
                    className="text-[12.5px]"
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await updateAppointmentStatus(a.id, "No-show")
                      toast.success("Marked as no-show")
                      refresh()
                    }}
                    className="text-[12.5px]"
                  >
                    <CircleSlash className="mr-2 h-3.5 w-3.5" /> Mark No-show
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await updateAppointmentStatus(a.id, "Cancelled")
                      toast.success("Appointment cancelled")
                      refresh()
                    }}
                    className="text-[12.5px]"
                  >
                    <CircleSlash className="mr-2 h-3.5 w-3.5" /> Cancel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#D9708A]/15" />
                  <DropdownMenuItem
                    onClick={async () => {
                      await deleteAppointment(a.id)
                      toast.success("Appointment deleted")
                      refresh()
                    }}
                    className="text-[12.5px] text-[#D9364B] focus:text-[#D9364B]"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>
    </div>
  )
}
