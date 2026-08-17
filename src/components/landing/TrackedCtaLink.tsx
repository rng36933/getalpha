"use client";

import Link from "next/link";
import { gtagEvent } from "@/lib/analytics/ga-client";

/**
 * A sign-up link that reports which spot on the page sent the click, so a
 * future ad campaign's landing performance isn't a single undifferentiated
 * number.
 */
export default function TrackedCtaLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => gtagEvent("cta_click", { location })}>
      {children}
    </Link>
  );
}
