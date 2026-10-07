"use client";

import Image from "next/image";

export function Hero() {
  return (
    <section className="relative lg:h-[112px]">
      <div className="lg:absolute lg:left-0 lg:top-[12px]">
        <h1 className="font-serif text-[30px] font-semibold leading-tight tracking-[-0.01em] text-[#241826] md:text-[38px]">
          Welcome Back, Admin!
        </h1>
        <p className="mt-2 text-[13.5px] text-[#6B6570]">
          Manage your members, appointments and grow your spa business.
        </p>
      </div>

      <div className="mt-4 text-center lg:absolute lg:left-[58%] lg:top-[4px] lg:mt-0 lg:-translate-x-1/2">
        <p className="font-display text-[26px] italic leading-[1.15] text-[#2a1a2b]">
          &ldquo;Self-care is a ritual,
          <br /> not a luxury.&rdquo;
        </p>
        <div className="mt-2 flex items-center justify-center gap-3 text-[#8a6f6a]">
          <span className="h-px w-16 bg-[#8a6f6a]/50" />
          <Image
            src="/logo.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
          <span className="h-px w-16 bg-[#8a6f6a]/50" />
        </div>
      </div>
    </section>
  );
}
