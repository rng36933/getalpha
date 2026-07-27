import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import ConsentGate from "@/components/ConsentGate";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { checkAccess } from "@/lib/billing/subscription";
import { getLocale } from "@/lib/i18n/server";
import { navCopy } from "@/lib/i18n/nav";
import { hasAcceptedCurrentTerms } from "@/lib/legal/acceptance";
import { CURRENT_LEGAL_VERSION, LEGAL_PAGES } from "@/lib/legal/documents";
import { ensureReferralLinked } from "@/lib/referral/program";
import { REFERRAL_COOKIE } from "@/lib/referral/cookie";

/**
 * Credits whoever invited this user, on their first visit only.
 *
 * Never allowed to break the app: an unattributed referral costs one person a
 * free week, while a layout that throws costs everybody the application.
 */
async function linkReferral(userId: string): Promise<void> {
  try {
    const store = await cookies();
    const code = store.get(REFERRAL_COOKIE)?.value ?? null;

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? null;

    await ensureReferralLinked(userId, code, email);
  } catch (error) {
    console.error("Could not link the referral for this account:", error);
  }
}

/**
 * Shell for the signed-in application. The sign-in and sign-up screens live in
 * the (auth) group and deliberately do not get the sidebar.
 *
 * The consent gate sits here rather than on each page, so a route added later
 * is covered without anyone remembering to cover it.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  if (userId && !(await hasAcceptedCurrentTerms(userId))) {
    return (
      <ConsentGate version={CURRENT_LEGAL_VERSION} documents={LEGAL_PAGES} />
    );
  }

  // After consent, not before: somebody who never agrees to the terms is not
  // an account anyone should be credited for inviting.
  if (userId) await linkReferral(userId);

  // The plan is read here rather than in each nav component so the two nav
  // surfaces cannot disagree about it, the same reason they share NAV_ITEMS.
  // `checkAccess` is the single definition of entitlement — a comped account
  // and an unexpired referral week both read as Pro, because both are.
  //
  // The locale is read here for the same reason: both nav surfaces have to
  // agree on it, and this is the one place in the tree both of them are
  // rendered from.
  const [access, user, locale] = await Promise.all([
    userId ? checkAccess(userId) : Promise.resolve({ allowed: false } as const),
    currentUser(),
    getLocale(),
  ]);

  const name =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    navCopy(locale).accountFallback;

  return (
    // A column on a phone, so the top bar can be sticky and the content can run
    // the full width; a row from `sm` up, where the sidebar returns.
    // `app-grid` lays the same faint grid the landing page uses behind the
    // desk. `isolate` keeps its fixed pseudo-element from being painted over
    // the cards, which sit in the normal flow above it.
    <div className="app-grid isolate flex min-h-screen flex-col sm:flex-row">
      <MobileNav pro={access.allowed} locale={locale} />
      <Sidebar name={name} pro={access.allowed} locale={locale} />
      {/* The bottom padding clears the fixed tab bar. Without it the last card
          on every page sits underneath the navigation. */}
      <main className="relative z-10 min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-8 sm:py-8 sm:pb-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
