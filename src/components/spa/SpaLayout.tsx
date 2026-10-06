"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar, MobileSidebar } from "@/components/spa/Sidebar";
import { Topbar } from "@/components/spa/Topbar";
import { Footer } from "@/components/spa/Footer";
import { ViewSwitcher } from "@/components/spa/ViewSwitcher";
import { AddMemberDialog } from "@/components/spa/AddMemberDialog";
import { BookAppointmentDialog } from "@/components/spa/BookAppointmentDialog";
import { CreateInvoiceDialog } from "@/components/spa/CreateInvoiceDialog";
import { MemberProfileSheet } from "@/components/spa/MemberProfileSheet";
import { EditMemberDialog } from "@/components/spa/dialogs/EditMemberDialog";
import { RenewMemberDialog } from "@/components/spa/dialogs/RenewMemberDialog";
import { useSpa } from "@/components/spa/SpaShell";

export function SpaLayout() {
  const { members } = useSpa();
  const [editId, setEditId] = useState<string | null>(null);
  const [renewId, setRenewId] = useState<string | null>(null);

  const editMember = members.find((m) => m.id === editId) ?? null;
  const renewMember = members.find((m) => m.id === renewId) ?? null;

  return (
    <div className="relative flex min-h-screen bg-[#F1E4DE] text-[#1F2937]">
      <Sidebar />
      <MobileSidebar />

      <div className="app-main-bg relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Spa still-life in the top-right corner (fades into the page) */}
        <div
          className="pointer-events-none absolute right-0 top-[66px] z-0 hidden w-[34%] min-w-[320px] max-w-[470px] md:block"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 38%), linear-gradient(to bottom, transparent 0%, #000 12%)",
            WebkitMaskComposite: "source-in",
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 38%), linear-gradient(to bottom, transparent 0%, #000 12%)",
            maskComposite: "intersect",
          }}
        >
          <Image
            src="/spa/ref/hero-right.jpg"
            alt=""
            width={862}
            height={226}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* Foliage peeking in at the bottom-left */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 z-0 hidden w-[240px] lg:block"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, #000 55%, transparent 100%), linear-gradient(to top, #000 55%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage:
              "linear-gradient(to right, #000 55%, transparent 100%), linear-gradient(to top, #000 55%, transparent 100%)",
            maskComposite: "intersect",
            opacity: 0.85,
          }}
        >
          <Image
            src="/spa/ref/leaves-bottom.jpg"
            alt=""
            width={512}
            height={188}
            className="h-auto w-full"
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1">
            <ViewSwitcher />
          </main>
          <Footer />
        </div>
      </div>

      {/* Global overlays */}
      <AddMemberDialog />
      <BookAppointmentDialog />
      <CreateInvoiceDialog />
      <MemberProfileSheet
        onEdit={(id) => setEditId(id)}
        onRenew={(id) => setRenewId(id)}
      />
      <EditMemberDialog
        member={editMember}
        open={!!editId}
        onOpenChange={(b) => !b && setEditId(null)}
      />
      <RenewMemberDialog
        member={renewMember}
        open={!!renewId}
        onOpenChange={(b) => !b && setRenewId(null)}
      />
    </div>
  );
}
