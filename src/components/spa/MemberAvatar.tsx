"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { colorForName, initials } from "@/lib/format";

// Portraits that ship with the reference design. Anyone else gets initials.
const FACES = new Set([
  "priya-sharma",
  "neha-verma",
  "anjali-mehta",
  "ritika-sood",
  "kavya-arora",
  "simran-kaur",
  "megha-bansal",
  "tanya-kapoor",
  "kriti-malhotra",
  "rhea-jain",
]);

export function slugForName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function MemberAvatar({
  name,
  size = 34,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const slug = slugForName(name);
  const c = colorForName(name);
  return (
    <Avatar
      style={{ width: size, height: size }}
      className={cn("shrink-0 ring-1 ring-white/80", className)}
    >
      {FACES.has(slug) && (
        <AvatarImage
          src={`/spa/avatars/${slug}.jpg`}
          alt={name}
          className="object-cover"
        />
      )}
      <AvatarFallback
        className="text-[11px] font-semibold"
        style={{ background: c.bg, color: c.fg }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
