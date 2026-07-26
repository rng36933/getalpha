import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  LineChart,
  Lock,
  PlugZap,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DayTapeReadout from "@/components/DayTapeReadout";
import AmbientCandles from "@/components/landing/AmbientCandles";
import Features from "@/components/landing/Features";
import Ticker from "@/components/landing/Ticker";
import VerdictCard from "@/components/landing/VerdictCard";
import WaitlistForm from "@/components/WaitlistForm";
import { LEGAL_PAGES } from "@/lib/legal/documents";
import { fetchCandles } from "@/lib/market-data/candles";
import { computeDayTape } from "@/lib/market-data/tape";
import { normaliseReferralCode } from "@/lib/referral/code";

export const metadata: Metadata = {
  title: "getALPHA — a trading desk that judges your process, not your luck",
  description:
    "Journal your trades, see the levels and the calendar that matter, and get a written review of how you traded — not a signal telling you what to buy.",
};

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <span className="grid size-7 place-items-center rounded-lg bg-accent font-bold text-background">
        α
      </span>
      <span>
        get<span className="text-accent">ALPHA</span>
      </span>
    </span>
  );
}

function Eyebrow({
  children,
  className = "text-zinc-500",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * Section headings.
 *
 * Geometric sans at display size with tight tracking and a top-lit gradient —
 * white into zinc, so the type has the same lighting as the cards under it.
 * `pb-[0.1em]` because `bg-clip-text` clips descenders flush otherwise.
 */
function Heading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mt-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text pb-[0.1em] text-[1.9rem] font-semibold leading-[1.1] tracking-[-0.03em] text-transparent text-balance sm:text-[2.6rem] ${className}`}
    >
      {children}
    </h2>
  );
}

/**
 * The drifting light points behind the hero.
 *
 * Fixed positions rather than random, so the composition is the same on every
 * load and can be judged. Long, offset durations keep them from pulsing in
 * unison, which is what makes this kind of thing look cheap.
 */
const MOTES = [
  { left: "8%", top: "18%", size: "size-1", dur: "13s", delay: "0s" },
  { left: "22%", top: "62%", size: "size-1.5", dur: "17s", delay: "1.5s" },
  { left: "41%", top: "12%", size: "size-1", dur: "15s", delay: "3s" },
  { left: "63%", top: "48%", size: "size-1", dur: "19s", delay: "0.8s" },
  { left: "78%", top: "24%", size: "size-1.5", dur: "14s", delay: "2.2s" },
  { left: "91%", top: "70%", size: "size-1", dur: "16s", delay: "4s" },
];

/**
 * The questions asked before signing up, answered honestly.
 *
 * Kept as data so the same strings feed both the visible list and the
 * structured-data block below it. Two copies of an answer is how a page ends up
 * telling a search engine something it no longer tells a reader.
 */
const FAQ = [
  {
    q: "Is getALPHA a trading platform?",
    a: "No. It never places an order and never touches your money. You keep trading with your own broker on your own platform; this reads what you did afterwards and tells you how you did it.",
  },
  {
    q: "Do you see my broker password?",
    a: "No, and there is nowhere for one to be stored. The MetaTrader add-on sends your closed trades out to us — we never connect to your terminal or your broker. It ships as readable source so you can check that claim rather than take it.",
  },
  {
    q: "How does the AI review a trade?",
    a: "Every number is calculated in code first — your risk, your result, how the exit compared to the plan — and the model is handed the finished figures to judge the process behind them. It comments on decisions you already made. It never predicts a price or tells you what to trade next.",
  },
  {
    q: "Which brokers are supported?",
    a: "Any broker you trade through desktop MetaTrader 5. The add-on reads the account your terminal is already logged into, so the broker never has to know we exist. MetaTrader has to be running for a sync to happen.",
  },
  {
    q: "What is actually free?",
    a: "The journal, the MetaTrader sync, the charts, the economic calendar, the per-instrument breakdown and the watchlist. Paying adds the two AI modules and nothing else, because those are the only parts that cost money every time they run.",
  },
  {
    q: "What happens if I delete my account?",
    a: "Your trades, notes, watchlist and terminal connection are deleted from the database. The record that you accepted the terms is kept, because that is the evidence that you did.",
  },
] as const;

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

  // Both series are cached per symbol@timeframe in the database, the same rows
  // the dashboard reads, so a visitor costs nothing at the price provider.
  const [landingDaily, landingIntraday] = await Promise.all([
    fetchCandles("XAU/USD", "D1"),
    fetchCandles("XAU/USD", "M15"),
  ]);

  const landingTape = computeDayTape({
    symbol: "XAU/USD",
    label: "XAUUSD",
    daily: landingDaily.data,
    intraday: landingIntraday.data,
  });

  return (
    <div className="min-h-screen bg-[#030712]">
      <Ticker />

      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#030712]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Wordmark />

          <div className="flex items-center gap-4 text-sm sm:gap-5">
            <Link
              href="#how"
              className="hidden text-zinc-400 transition-all duration-300 ease-in-out hover:text-white sm:inline"
            >
              How it works
            </Link>
            <Link
              href="/login"
              className="text-zinc-400 transition-all duration-300 ease-in-out hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-white px-4 py-2 font-medium text-[#030712] transition-all duration-300 ease-in-out hover:bg-zinc-200"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* `overflow-hidden` is load-bearing, not tidiness. The glow below is
            wider than the viewport and centred, so without it the whole page
            gained a horizontal scroll on a 375px phone — the site sliding under
            the thumb because of an ornament nobody can even see move. */}
        <section className="relative overflow-hidden py-14 sm:py-24">
          {/* Three background layers, back to front: grid, candles, glow. */}
          <div
            aria-hidden="true"
            className="lp-grid pointer-events-none absolute inset-0"
          />

          <AmbientCandles />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-72 left-1/2 h-[40rem] w-[min(64rem,130vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.16),transparent_62%)]"
          />

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {MOTES.map((mote) => (
              <span
                key={`${mote.left}-${mote.top}`}
                className={`lp-drift absolute ${mote.size} rounded-full bg-white/70 blur-[1px]`}
                style={
                  {
                    left: mote.left,
                    top: mote.top,
                    "--dur": mote.dur,
                    "--delay": mote.delay,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                <Zap className="size-3 shrink-0 text-emerald-400" aria-hidden="true" />
                journal · session brief · process review
              </span>

              {/* Two sentences, lit differently: the gap is stated in grey and
                  the thing this product does about it is stated in white. The
                  strikethrough that used to carry the argument asked a reader
                  to parse a joke before they understood the product. */}
              <h1 className="mt-5 pb-[0.1em] text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.04em] text-balance sm:text-[3.5rem] lg:text-[4rem]">
                <span className="bg-gradient-to-b from-zinc-500 to-zinc-600 bg-clip-text text-transparent">
                  Most traders measure the outcome.
                </span>{" "}
                <span className="bg-gradient-to-b from-white via-white to-zinc-400 bg-clip-text text-transparent">
                  Almost none measure the decision.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400 sm:text-base">
                getALPHA reads the trade you actually took — the size, the stop,
                the exit, the note you wrote at the time — and tells you whether
                the process was sound.{" "}
                <span className="text-zinc-200">
                  Winning on a broken process is the expensive kind of luck.
                </span>
              </p>

              {/*
                The front door, open.

                This was a waitlist form and nothing else — on a product that is
                deployed, registers accounts and charges cards. Somebody who
                wanted to try it had to notice the small button in the header.
              */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="lp-shimmer group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-500 px-6 py-3.5 font-semibold text-[#030712] shadow-lg shadow-emerald-500/20 transition-all duration-300 ease-in-out hover:bg-emerald-400 hover:shadow-emerald-400/30"
                >
                  Start your free journal
                  <ArrowRight
                    className="size-4 shrink-0 transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>

                <p className="text-sm leading-relaxed text-zinc-500">
                  The journal, charts and calendar cost nothing.
                  <br className="hidden sm:inline" /> No card, no trial clock.
                </p>
              </div>

              {/* The one sentence a trader wants before connecting a terminal,
                  placed where they decide rather than in the privacy policy.
                  Every clause here is checkable — the EA ships as source, so
                  "it only sends" is a claim somebody can read for themselves.
                  Nothing is promised about encryption or about who can see the
                  data once it arrives, because that would not be true. */}
              <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-zinc-400">
                <Lock
                  className="mt-0.5 size-3.5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <span>
                  <span className="text-zinc-200">
                    No broker password ever leaves your machine.
                  </span>{" "}
                  The MetaTrader add-on only sends — it is shipped as readable
                  source so you can check that yourself — and nothing here can
                  place a trade or move money. Your record is never sold or
                  shared.
                </span>
              </p>

              <p className="mt-5 text-xs text-zinc-600">
                Rather be told when the AI modules change?{" "}
                <Link
                  href="#keep-in-touch"
                  className="text-zinc-400 underline-offset-2 transition-all duration-300 ease-in-out hover:text-white hover:underline"
                >
                  Leave an address instead
                </Link>
                .
              </p>
            </div>

            <VerdictCard />
          </div>
        </section>

        {/* Today's gold, measured, on the public page.
            Every other figure here is a labelled example — this one is the real
            session, read live.

            Shown only while gold is actually trading. A section headed "Live,
            right now" displaying a flat line and a "market closed" warning is
            worse than no section: this is the shop window, and every weekend
            visitor would meet a product that looks asleep. */}
        {landingTape && !landingTape.barelyTraded ? (
          <section className="border-t border-white/[0.05] py-14 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <Eyebrow className="text-emerald-400">
                <span className="inline-flex items-center gap-2">
                  <span className="live-dot size-1.5 rounded-full bg-emerald-400" />
                  live, right now
                </span>
              </Eyebrow>
              <Heading>Gold&rsquo;s session, as the desk reads it.</Heading>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
                Not a screenshot and not an example. This is the live readout, the
                same one on the dashboard — every arrow a measurement of a session
                that has already happened.
              </p>

              <div className="lp-glass mt-8 rounded-2xl p-4 sm:p-6">
                <DayTapeReadout
                  tape={landingTape}
                  fetchedAt={landingDaily.fetchedAt}
                  stale={landingDaily.status === "CACHED"}
                />
              </div>
            </div>
          </section>
        ) : null}

        <section id="how" className="border-t border-white/[0.05] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Eyebrow>What you get</Eyebrow>
            <Heading>
              Four modules. Every number computed from your own record.
            </Heading>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
              There is no signal feed here, and there never will be. What there
              is: an honest record, the context around the session you are about
              to trade, and a reviewer that has read every trade you have logged.
            </p>

            <Features />
          </div>
        </section>

        {/* What actually happens after signing up.
            The page explained what the product is and never what using it looks
            like, which is the gap between "I understand this" and "I can see
            myself doing this". Three steps, and the middle one is deliberately
            "carry on as you were" — the strongest thing about the sync is that
            it asks nothing of the trading itself. */}
        <section className="border-t border-white/[0.05] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Eyebrow>How it fits your week</Eyebrow>
            <Heading>Three steps, and only the first one takes any time.</Heading>

            <ol className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: PlugZap,
                  title: "Connect",
                  body: "Drop the add-on into MetaTrader and paste one key. About a minute, once. Ninety days of history arrives on the first sync.",
                  note: "Desktop MetaTrader 5",
                },
                {
                  icon: LineChart,
                  title: "Trade",
                  body: "Nothing changes. Take the trades you were going to take, on the platform you already use. Every closed position lands in the journal by itself.",
                  note: "No new habit to keep",
                },
                {
                  icon: Sparkles,
                  title: "Review",
                  body: "Read the session brief before the open, and ask for a written review of any trade — sizing, stop placement, exit, and whether you followed your own plan.",
                  note: "The part that costs money to run",
                },
              ].map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    key={step.title}
                    className="lp-glass group rounded-2xl p-5 transition-all duration-300 ease-in-out hover:border-zinc-700 sm:p-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] transition-all duration-300 ease-in-out group-hover:-translate-y-1">
                        <Icon
                          className="size-4 text-zinc-300"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.16em] text-zinc-600">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-zinc-400">
                      {step.body}
                    </p>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                      {step.note}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-white/[0.05] py-14 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-80 w-[min(48rem,120vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_65%)]"
          />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <Eyebrow>Plans</Eyebrow>
            <Heading>The journal is free. The judgement is not.</Heading>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
              Reading a model costs money every time, so the two AI modules are
              what Pro pays for. Everything else stays free for as long as you use
              it.
            </p>

            <div className="mt-10 grid grid-cols-1 items-start gap-6 sm:mt-14 lg:grid-cols-2 lg:gap-8">
              {/* Free: integrated into the page rather than presented as an
                  offer. It is the default, not the consolation. */}
              <div className="rounded-2xl border border-white/[0.06] p-6 sm:p-7">
                <Eyebrow>Free</Eyebrow>
                <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-white">
                  €0
                </p>
                <p className="mt-2 text-[13px] text-zinc-500">
                  For as long as you use it.
                </p>

                <ul className="mt-7 grid gap-3 text-[14px] text-zinc-400">
                  {[
                    "Trade journal with computed P&L and risk",
                    "Cumulative R curve and outcome distribution",
                    "Live charts for your watchlist",
                    "Economic calendar in your own timezone",
                    "MetaTrader sync — 90 days of history",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-zinc-500"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="mt-8 block rounded-xl border border-white/[0.08] px-5 py-3 text-center text-sm font-medium text-white transition-all duration-300 ease-in-out hover:border-zinc-600 hover:bg-white/[0.03]"
                >
                  Start free
                </Link>
              </div>

              {/* Pro: lifted out of the page. The gradient border is a wrapper
                  with a padding of one pixel, which is the only way to get a
                  gradient stroke on a rounded box without an SVG. */}
              <div className="relative rounded-[1.05rem] bg-gradient-to-b from-violet-500/60 via-violet-500/20 to-transparent p-px shadow-2xl shadow-violet-500/10 lg:-mt-4">
                <div className="relative h-full rounded-2xl bg-[#0a0a12] p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Eyebrow className="text-violet-300">Pro</Eyebrow>
                      <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-white">
                        €19.99
                        <span className="ml-1.5 text-sm font-normal text-zinc-500">
                          / month
                        </span>
                      </p>
                      <p className="mt-2 text-[13px] text-zinc-500">
                        Or €99.99 a year.
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                      <Sparkles className="size-3 shrink-0" aria-hidden="true" />
                      most popular
                    </span>
                  </div>

                  <ul className="mt-7 grid gap-3 text-[14px] text-zinc-300">
                    {[
                      "AI Session Brief before every session",
                      "AI Coach process review on any trade",
                      "Six dimensions judged against your own history",
                      "Everything in Free",
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-violet-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className="lp-shimmer group relative mt-8 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 ease-in-out hover:from-violet-400 hover:to-violet-500"
                  >
                    Get started
                    <ArrowRight
                      className="size-4 shrink-0 transition-all duration-300 ease-in-out group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>

                  <p className="mt-4 text-center text-[11px] text-zinc-600">
                    Cancel whenever. The journal stays free either way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The waitlist, kept but demoted to what it now is: a way to hear about
            the paid modules without signing up for anything. It is no longer the
            only door on the page. */}
        <section
          id="keep-in-touch"
          className="border-t border-white/[0.05] py-14 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <Eyebrow>Not ready to sign up</Eyebrow>
                <Heading className="sm:text-[2.2rem]">
                  Then don&rsquo;t. Leave an address instead.
                </Heading>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
                  One note when the AI modules change in a way worth knowing
                  about. Not a newsletter, and not a queue — the desk is open, and
                  you can walk in whenever you like.
                </p>
              </div>

              <div className="lp-glass max-w-md rounded-2xl p-5">
                <WaitlistForm referralCode={referralCode} />
              </div>
            </div>
          </div>
        </section>

        {/* Answers, and the page's only real body of text.
            The rest of the landing page is deliberately short, which leaves a
            search engine very little to read. These are the questions somebody
            actually asks before connecting a terminal, so the section earns its
            place twice — and every answer is one this product can stand behind.

            Rendered as plain markup rather than a JS accordion: a crawler reads
            what is in the document, and an answer hidden behind a click is an
            answer some readers never find. */}
        <section id="faq" className="border-t border-white/[0.05] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Eyebrow>Questions</Eyebrow>
            <Heading>Before you connect anything.</Heading>

            <dl className="mt-10 grid gap-4 lg:grid-cols-2">
              {FAQ.map((item) => (
                <div key={item.q} className="lp-glass rounded-2xl p-5 sm:p-6">
                  <dt className="text-[15px] font-semibold tracking-tight text-white">
                    {item.q}
                  </dt>
                  <dd className="mt-2.5 text-[14px] leading-relaxed text-zinc-400">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>

            {/* The structured data that lets these answers appear in a search
                result. Built from the same array as the list above, so the two
                cannot drift.

                Rendered as a script child rather than through
                `dangerouslySetInnerHTML`: React escapes it as text, and this
                app has no instances of that prop anywhere — worth keeping at
                zero, because the next person to reach for it may not be
                inserting a compile-time constant. */}
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: FAQ.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: { "@type": "Answer", text: item.a },
                })),
              })}
            </script>
          </div>
        </section>

        <section className="border-t border-white/[0.05] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7">
              <Eyebrow>What this is not</Eyebrow>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-zinc-400">
                getALPHA is an educational and informational tool. It is not an
                investment adviser or a broker, it does not provide financial
                advice or trading signals, and every financial decision you make
                using it is yours alone. Trading leveraged instruments carries a
                high risk of loss, and past performance is not a reliable
                indicator of future results.
              </p>
              <Link
                href="/disclaimer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-all duration-300 ease-in-out hover:text-white"
              >
                Read the full risk disclaimer
                <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-7 text-[13px] text-zinc-500 sm:px-8">
          <span>© {new Date().getUTCFullYear()} getALPHA</span>
          <nav className="flex gap-5">
            {LEGAL_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="transition-all duration-300 ease-in-out hover:text-white"
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
