"use client";

import { useState, useMemo } from "react";
import { Plus, Download, IndianRupee, Smartphone, CreditCard, Wallet, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useSpa } from "../SpaShell";
import { MethodPill, PayStatusPill } from "../Pills";
import { formatINR, formatDate, exportCSV } from "@/lib/format";
import { refundPayment } from "@/app/actions/payments";
import { toast } from "sonner";

export function PaymentsView() {
  const { payments, setCreateInvoiceOpen, refresh } = useSpa();
  const [filter, setFilter] = useState("all")

  const kpis = useMemo(() => {
    const paid = payments.filter((p) => p.status === "Paid")
    const total = paid.reduce((s, p) => s + p.amount, 0)
    const upi = paid.filter((p) => p.method === "UPI").reduce((s, p) => s + p.amount, 0)
    const card = paid.filter((p) => p.method === "Card").reduce((s, p) => s + p.amount, 0)
    const cash = paid.filter((p) => p.method === "Cash").reduce((s, p) => s + p.amount, 0)
    const refunds = payments.filter((p) => p.status === "Refunded").reduce((s, p) => s + p.amount, 0)
    return { total, upi, card, cash, refunds }
  }, [payments])

  const filtered = payments.filter((p) => {
    if (filter === "all") return true
    return p.method.toLowerCase() === filter.toLowerCase() || p.status.toLowerCase() === filter.toLowerCase()
  })

  function handleExport() {
    const rows = filtered.map((p, i) => ({
      "#": i + 1,
      Invoice: p.invoiceNo,
      Member: p.memberName ?? "",
      Description: p.description ?? "",
      Amount: p.amount,
      Method: p.method,
      Status: p.status,
      Date: p.paidAt,
    }))
    exportCSV("bella-luxe-payments.csv", rows)
    toast.success("Payments exported", { description: `${rows.length} rows downloaded.` })
  }

  const kpiCards = [
    { label: "Total Collected", value: kpis.total, icon: IndianRupee, color: "#2E9E6E", bg: "#DDF3E8" },
    { label: "UPI", value: kpis.upi, icon: Smartphone, color: "#B8456A", bg: "#FBE4E2" },
    { label: "Card", value: kpis.card, icon: CreditCard, color: "#8B5CA6", bg: "#EFE3F4" },
    { label: "Cash", value: kpis.cash, icon: Wallet, color: "#E08A2E", bg: "#FCE8CF" },
    { label: "Refunds", value: kpis.refunds, icon: RotateCcw, color: "#D9364B", bg: "#FBDDE0" },
  ]

  return (
    <div className="space-y-4 p-4 md:p-6 animate-fade-up">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-bold text-[#3D1F2B]">Payments</h1>
          <p className="text-[12.5px] text-[#7A6E66]">{payments.length} invoices recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="h-10 rounded-full border-[#D9708A]/25 bg-white/70 text-[12.5px] font-semibold text-[#3D1F2B] hover:bg-white"
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => setCreateInvoiceOpen(true)}
            className="h-10 rounded-full bg-gradient-to-r from-[#D9708A] to-[#B8456A] px-5 text-[12.5px] font-semibold text-white shadow-rose-glow hover:from-[#B8456A] hover:to-[#8E3454]"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpiCards.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="glass-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: k.bg }}>
                <Icon className="h-5 w-5" style={{ color: k.color }} />
              </div>
              <div className="mt-2 font-serif text-[20px] font-bold text-[#3D1F2B]">
                {formatINR(k.value)}
              </div>
              <div className="text-[11px] text-[#7A6E66]">{k.label}</div>
            </div>
          )
        })}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-[#D9708A]/12 px-5 py-3">
          <h3 className="font-serif text-[15px] font-bold text-[#3D1F2B]">All Transactions</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#D9708A]/12 bg-[#F8F1E9]/40 hover:bg-transparent">
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Invoice</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Member</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Description</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Amount</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Method</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Status</TableHead>
              <TableHead className="text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Date</TableHead>
              <TableHead className="text-right text-[10.5px] font-semibold uppercase tracking-wider text-[#7A6E66]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} className="border-b border-[#D9708A]/8 hover:bg-[#FBE4E2]/30">
                <TableCell className="font-mono text-[12px] font-semibold text-[#3D1F2B]">{p.invoiceNo}</TableCell>
                <TableCell className="text-[12.5px] font-medium text-[#1A1A1A]">{p.memberName}</TableCell>
                <TableCell className="text-[12px] text-[#7A6E66]">{p.description ?? "—"}</TableCell>
                <TableCell className="text-[12.5px] font-semibold text-[#3D1F2B]">{formatINR(p.amount)}</TableCell>
                <TableCell><MethodPill method={p.method} /></TableCell>
                <TableCell><PayStatusPill status={p.status} /></TableCell>
                <TableCell className="text-[11.5px] text-[#7A6E66]">{formatDate(p.paidAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-[#FBE4E2]">
                        <MoreHorizontal className="h-4 w-4 text-[#7A6E66]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl border-[#D9708A]/15 bg-white">
                      <DropdownMenuItem
                        onClick={() => toast.success(`Invoice ${p.invoiceNo} downloaded`)}
                        className="text-[12.5px]"
                      >
                        <Download className="mr-2 h-3.5 w-3.5" /> Download Invoice
                      </DropdownMenuItem>
                      {p.status !== "Refunded" && (
                        <DropdownMenuItem
                          onClick={async () => {
                            await refundPayment(p.id)
                            toast.success("Payment refunded")
                            refresh()
                          }}
                          className="text-[12.5px] text-[#D9364B] focus:text-[#D9364B]"
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Refund
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
