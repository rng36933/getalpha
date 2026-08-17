"use client";

import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
};

export default function Button({ href, children, variant = "primary", onClick }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl px-6 py-3.5 font-semibold shadow-lg";
  const primary = "bg-emerald-500 text-[#030712] hover:bg-emerald-600";
  const ghost = "border border-white/[0.08] text-white hover:border-zinc-600";

  return (
    <Link href={href} className={`${base} ${variant === "primary" ? primary : ghost}`} onClick={onClick}>
      {children}
    </Link>
  );
}
