import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import WaitlistForm from "@/components/WaitlistForm";
import { LEGAL_PAGES } from "@/lib/legal/documents";
import { normaliseReferralCode } from "@/lib/referral/code";

export const metadata: Metadata = {
  title: "getALPHA — a trading desk that judges your process, not your luck",
  description:
    "Journal your trades, see the levels and the calendar that matter, and get a written review of how you traded — not a signal telling you what to buy.",
};

const FEATURES = [
  {
    title: "A journal that computes",
    body: "R-multiples, planned reward-to-risk and risk as a share of equity are calculated in code from what you record. Nothing is estimated and nothing is guessed.",
  },
  {
    title: "The session, before it starts",
    body: "One short brief for the desk: the tone of the session, the single driver that matters, and where volatility is likely. Written from the calendar, levels and headlines it names.",
  },
  {
    title: "A review of your process",
    body: "Six dimensions of how one trade was taken, judged against your own history rather than a generic ideal. A trade that made money on a broken process is told it was one.",
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { userId } = await auth();

  // Somebody already signed in has no use for the pitch.
  if (userId) redirect("/dashboard");

  const { ref } = await searchParams;
  const referralCode = normaliseReferralCode(ref);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <span className="text-sm font-semibold tracking-tight">
            get<span className="text-accent">ALPHA</span>
          </span>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-muted hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 font-medium text-background hover:bg-accent/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A trading desk that judges your{" "}
            <span className="text-accent">process</span>, not your luck.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Journal what you traded and why. See the levels and the calendar that
            matter. Get a written review of how you took the trade — never a
            recommendation about what to take next.
          </p>

          <div className="mt-8 max-w-lg">
            <WaitlistForm referralCode={referralCode} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <h2 className="text-sm font-medium">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.body}
              </p>
            </div>
          ))}
        </section>

        <section className="border-t border-line py-10">
          <h2 className="text-sm font-medium">What this is not</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            getALPHA is an educational and informational tool. It is not an
            investment adviser or a broker, it does not provide financial advice
            or trading signals, and every financial decision you make using it is
            yours alone. Trading leveraged instruments carries a high risk of
            loss.
          </p>
          <Link
            href="/disclaimer"
            className="mt-3 inline-block text-sm text-accent hover:underline"
          >
            Read the full risk disclaimer
          </Link>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted">
          <span>© {new Date().getUTCFullYear()} getALPHA</span>
          <nav className="flex gap-4">
            {LEGAL_PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="hover:text-foreground">
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
