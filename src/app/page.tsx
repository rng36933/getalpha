import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { landingCopy } from "@/lib/i18n/landing";
import { normaliseReferralCode } from "@/lib/referral/code";

const copy = landingCopy("en");

/**
 * English is served here, unprefixed, and Lithuanian at `/lt`.
 *
 * `alternates` is the part that makes translating worth doing at all. Without
 * reciprocal hreflang tags Google treats the two as unrelated pages competing
 * with each other; with them it knows they are one page in two languages and
 * shows a Lithuanian searcher the Lithuanian one. `x-default` points here,
 * because a visitor whose language matches neither should get English.
 */
export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  alternates: {
    canonical: "/",
    languages: { en: "/", lt: "/lt", "x-default": "/" },
  },
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { userId } = await auth();

  // Somebody already signed in has no use for the pitch.
  if (userId) redirect("/dashboard");

  const { ref } = await searchParams;

  return <Landing locale="en" referralCode={normaliseReferralCode(ref)} />;
}
