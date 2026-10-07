import Image from "next/image";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="relative flex flex-col items-center justify-center gap-2 px-6 pb-5 pt-6 md:flex-row">
        <div className="flex items-center gap-4">
          <span className="h-px w-16 bg-[#9a8580]/50" />
          <span className="text-[12px] font-normal uppercase tracking-[0.34em] text-[#7a6a68]">
            Bella Luxe Day Spa
          </span>
          <span className="h-px w-16 bg-[#9a8580]/50" />
        </div>
        <div className="flex items-center gap-3 text-[#8a7a78] md:absolute md:right-6 md:top-1/2 md:mt-0.5 md:-translate-y-1/2">
          <span className="text-[10px] font-normal uppercase tracking-[0.26em]">
            More than a spa, a better you
          </span>
          <span className="hidden h-4 w-px bg-[#9a8580]/40 md:block" />
          <Image
            src="/logo.png"
            alt=""
            width={18}
            height={18}
            className="hidden h-[18px] w-[18px] rounded-full object-cover md:block"
          />
        </div>
      </div>
    </footer>
  );
}
