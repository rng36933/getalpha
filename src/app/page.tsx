import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { landingCopy } from "@/lib/i18n/landing";
import { normaliseReferralCode } from "@/lib/referral/code";

export const metadata: Metadata = {
  title: landingCopy.meta.title,
  description: landingCopy.meta.description,
  alternates: { canonical: "/" },
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

  return <Landing referralCode={normaliseReferralCode(ref)} />;
}
