"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  RefreshCw,
  Bell,
  Trash2,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { useSpa } from "./SpaShell";
import { StatusPill } from "./Pills";
import { formatDate } from "@/lib/format";
import { MemberAvatar } from "./MemberAvatar";
import { deleteMember, sendReminder } from "@/app/actions/members";
import { toast } from "sonner";

interface Props {
  rows?: number;
  onEdit?: (memberId: string) => void;
  onRenew?: (memberId: string) => void;
  onDelete?: (memberId: string) => void;
}

export function RecentMembers({ rows, onEdit, onRenew, onDelete }: Props) {
  const { members, refresh, openMember, setView } = useSpa();
  const list = rows ? members.slice(0, rows) : members;

  const th =
    "h-9 text-[12.5px] font-medium text-[#6b6470] first:rounded-l-lg last:rounded-r-lg";

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-[#2a1a2b]">
          <UserRound className="h-5 w-5 text-[#7a2a55]" strokeWidth={1.6} />
          Recent Members
        </h3>
        <button
          onClick={() => setView("members")}
          className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#7a2a55] hover:text-[#5d1f40]"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        className={
          rows
            ? "flex-1 px-5 pb-4"
            : "sidebar-scroll max-h-[560px] flex-1 overflow-y-auto px-5 pb-4"
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-[#F6F3F2] hover:bg-[#F6F3F2]">
              <TableHead className={`${th} w-[40px] pl-3`}>#</TableHead>
              <TableHead className={th}>Name</TableHead>
              <TableHead className={th}>Membership Plan</TableHead>
              <TableHead className={th}>Status</TableHead>
              <TableHead className={th}>Start Date</TableHead>
              <TableHead className={th}>Expiry Date</TableHead>
              <TableHead className={`${th} text-center`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((m, i) => {
              const isExpiring = m.membershipStatus === "Expiring Soon";
              return (
                <TableRow
                  key={m.id}
                  onClick={() => openMember(m.id)}
                  className="h-[41px] cursor-pointer border-b border-[#2D1B30]/[0.06] transition-colors last:border-0 hover:bg-[#FBE4E2]/40"
                >
                  <TableCell className="py-1.5 pl-3 text-[13px] text-[#3a3340]">
                    {i + 1}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={m.name} size={34} />
                      <span className="truncate text-[13.5px] text-[#2a2430]">
                        {m.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">
                    {m.currentPlanName ?? "—"}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <StatusPill status={m.membershipStatus} />
                  </TableCell>
                  <TableCell className="py-1.5 text-[13px] text-[#2a2430]">
                    {formatDate(m.membershipStart)}
                  </TableCell>
                  <TableCell
                    className={
                      isExpiring
                        ? "py-1.5 text-[13px] font-medium text-[#E0305F]"
                        : "py-1.5 text-[13px] text-[#2a2430]"
                    }
                  >
                    {formatDate(m.membershipEnd)}
                  </TableCell>
                  <TableCell
                    className="py-1.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-[#FBE4E2]"
                        >
                          <MoreHorizontal className="h-4 w-4 text-[#3a3340]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 rounded-xl border-[#2D1B30]/10 bg-white"
                      >
                        <DropdownMenuItem
                          onClick={() => openMember(m.id)}
                          className="text-[12.5px]"
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit?.(m.id)}
                          className="text-[12.5px]"
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRenew?.(m.id)}
                          className="text-[12.5px]"
                        >
                          <RefreshCw className="mr-2 h-3.5 w-3.5" /> Renew
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            const r = await sendReminder(m.id);
                            toast.success(`Reminder sent to ${r.name}`);
                            refresh();
                          }}
                          className="text-[12.5px]"
                        >
                          <Bell className="mr-2 h-3.5 w-3.5" /> Send reminder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2D1B30]/10" />
                        <DropdownMenuItem
                          onClick={async () => {
                            if (onDelete) {
                              onDelete(m.id);
                            } else {
                              await deleteMember(m.id);
                              toast.success("Member deleted");
                              refresh();
                            }
                          }}
                          className="text-[12.5px] text-[#EF4444] focus:text-[#EF4444]"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-[12.5px] text-[#6B7280]"
                >
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
