import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AmbientCandles from "@/components/landing/AmbientCandles";
import Features from "@/components/landing/Features";
import Ticker from "@/components/landing/Ticker";
import VerdictCard from "@/components/landing/VerdictCard";
import WaitlistForm from "@/components/WaitlistForm";
import { LEGAL_PAGES } from "@/lib/legal/documents";
import { normaliseReferralCode } from "@/lib/referral/code";

export const metadata: Metadata = {
  title: "getALPHA — a trading desk that judges your process, not your luck",
  description:
    "Journal your trades, see the levels and the calendar that matter, and get a written review of how you traded — not a signal telling you what to buy.",
};

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-accent font-bold text-background">
        α
      </span>
      <span>
        get<span className="text-accent">ALPHA</span>
      </span>
    </span>
  );
}

function Eyebrow({ children, className = "text-muted" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${className}`}>
      {children}
    </p>
  );
}

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
      <Ticker />

      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Wordmark />

        <div className="flex items-center gap-5 text-sm">
          <Link href="#how" className="hidden text-muted hover:text-foreground sm:inline">
            How it works
          </Link>
          <Link href="/login" className="text-muted hover:text-foreground">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 font-medium text-background transition-[filter] hover:brightness-110"
          >
            Get started
          </Link>
        </div>
      </header>

      <main>
        <section className="relative py-12 sm:py-20">
          <AmbientCandles />

          {/* The glow sits above the candles and below the content. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-72 left-1/2 h-[40rem] w-[min(64rem,130vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(91,140,255,0.16),transparent_62%)]"
          />

          <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <Eyebrow>Trading journal · Session brief · Process review</Eyebrow>

              <h1 className="mt-3.5 text-[2.375rem] font-semibold leading-[1.02] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
                Your best trade this month was{" "}
                <span className="text-muted line-through decoration-negative decoration-2">
                  a good trade
                </span>
                .
              </h1>

              <p className="mt-5 max-w-xl text-muted sm:text-[17px]">
                getALPHA reads the trade you actually took — the size, the stop,
                the exit, the note you wrote at the time — and tells you whether
                the process was sound. Winning on a broken process is the
                expensive kind of luck.
              </p>

              <div className="mt-8 max-w-md">
                <WaitlistForm referralCode={referralCode} />
              </div>
            </div>

            <VerdictCard />
          </div>
        </section>

        <section id="how" className="border-t border-line py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Eyebrow>What you get</Eyebrow>
            <h2 className="mt-3.5 text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              Three things, and none of them tell you what to buy.
            </h2>
            <p className="mt-3.5 max-w-2xl text-muted">
              There is no signal feed here, and there never will be. What there
              is: an honest record, the context around the session you are about
              to trade, and a reviewer that has read every trade you have
              logged.
            </p>

            <Features />
          </div>
        </section>

        <section className="border-t border-line py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Eyebrow>Plans</Eyebrow>
            <h2 className="mt-3.5 text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
              The journal is free. The judgement is not.
            </h2>
            <p className="mt-3.5 max-w-2xl text-muted">
              Reading a model costs money every time, so the two AI modules are
              what Pro pays for. Everything else stays free for as long as you
              use it.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
                <div>
                  <Eyebrow>Free</Eyebrow>
                  <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                    €0
                  </p>
                </div>
                <ul className="grid gap-2 text-[15px] text-muted">
                  {[
                    "Trade journal with computed R-multiples",
                    "Live charts for your watchlist",
                    "Economic calendar in your own timezone",
                  ].map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-2.5">
                      <span aria-hidden="true" className="text-accent">
                        →
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-accent/40 bg-surface p-6">
                <div>
                  <Eyebrow className="text-accent">Pro</Eyebrow>
                  <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                    €19.99{" "}
                    <span className="text-sm font-normal text-muted">
                      / month
                    </span>
                  </p>
                </div>
                <ul className="grid flex-1 gap-2 text-[15px] text-muted">
                  {[
                    "AI Session Brief before every session",
                    "AI Coach process review on any trade",
                    "Everything in Free",
                  ].map((item) => (
                    <li key={item} className="grid grid-cols-[1rem_1fr] gap-2.5">
                      <span aria-hidden="true" className="text-accent">
                        →
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="rounded-lg bg-accent px-5 py-2.5 text-center text-sm font-semibold text-background transition-[filter] hover:brightness-110"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-line py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-7">
              <Eyebrow>What this is not</Eyebrow>
              <p className="mt-3 max-w-3xl text-muted">
                getALPHA is an educational and informational tool. It is not an
                investment adviser or a broker, it does not provide financial
                advice or trading signals, and every financial decision you make
                using it is yours alone. Trading leveraged instruments carries a
                high risk of loss, and past performance is not a reliable
                indicator of future results.
              </p>
              <Link
                href="/disclaimer"
                className="mt-3 inline-block text-sm text-accent hover:underline"
              >
                Read the full risk disclaimer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-[13px] text-muted sm:px-8">
          <span>© {new Date().getUTCFullYear()} getALPHA</span>
          <nav className="flex gap-5">
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
