"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useSpa } from "./SpaShell";

export function PromoBanner() {
  const { setView } = useSpa();
  return (
    <div
      className="relative min-h-[106px] flex-1 overflow-hidden rounded-2xl border border-white/70 shadow-[0_6px_24px_rgba(120,60,80,0.08)]"
      style={{
        background:
          "linear-gradient(90deg, #F1E0DC 0%, #E8CEC6 45%, #D4B0A2 100%)",
      }}
    >
      {/* massage still, fading into the gradient */}
      <div
        className="absolute inset-y-0 right-0 w-[58%]"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 45%)",
          maskImage: "linear-gradient(to right, transparent 0%, #000 45%)",
        }}
      >
        <Image
          src="/spa/ref/banner-woman.jpg"
          alt=""
          fill
          sizes="300px"
          className="object-cover object-right"
        />
      </div>

      {/* botanical line-art */}
      <svg
        viewBox="0 0 60 90"
        fill="none"
        stroke="#B99487"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="absolute bottom-0 left-3 h-[84px] w-14 opacity-70"
        aria-hidden
      >
        <path d="M30 88 C30 60 26 40 34 10" />
        <path d="M30 70 C18 66 10 56 8 44 C20 46 28 56 30 70Z" />
        <path d="M31 52 C42 48 50 38 52 26 C40 28 33 38 31 52Z" />
        <path d="M33 30 C26 26 20 20 19 10 C27 12 32 20 33 30Z" />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-center py-3 pl-[76px] pr-4">
        <p className="font-display text-[23px] italic leading-[1.12] text-[#3a2430]">
          Healthy Body
          <br />
          Happier You
        </p>
        <button
          onClick={() => setView("services")}
          className="mt-2.5 inline-flex h-[26px] w-fit items-center gap-1.5 rounded-md bg-gradient-to-r from-[#8a2f63] to-[#6b2650] px-3 text-[11.5px] font-medium text-white shadow-sm hover:brightness-110"
        >
          Explore Services <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
