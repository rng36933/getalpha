import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { landingCopy } from "@/lib/i18n/landing";
import { normaliseReferralCode } from "@/lib/referral/code";

const copy = landingCopy("lt");

/**
 * The Lithuanian landing page.
 *
 * A real route with a real URL rather than the same address serving different
 * words by IP, and that is the whole design. Googlebot crawls from the United
 * States: swap the content by country at one URL and the Lithuanian version is
 * never fetched, never indexed, and the reason for translating it disappears.
 * At `/lt` it is a page a crawler can reach, and the hreflang pair below tells
 * Google the two are the same page in two languages rather than duplicates
 * competing with each other.
 *
 * Only this page is translated. The signed-in app stays English by decision,
 * and Clerk's sign-in screens by necessity — its localisation package ships 49
 * locales and Lithuanian is not one of them.
 */
export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
  alternates: {
    canonical: "/lt",
    languages: { en: "/", lt: "/lt", "x-default": "/" },
  },
};

export default async function LithuanianLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { userId } = await auth();

  if (userId) redirect("/dashboard");

  const { ref } = await searchParams;

  return <Landing locale="lt" referralCode={normaliseReferralCode(ref)} />;
}
