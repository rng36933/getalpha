import {
  ArrowRight,
  Zap,
  Lock,
} from "lucide-react";
import DayTapeReadout from "@/components/DayTapeReadout";
import AmbientCandles from "@/components/landing/AmbientCandles";
import VerdictCard from "@/components/landing/VerdictCard";
import Button from "@/components/ui/Button";

interface HeroCopy {
  hero: {
    badge: string;
    headingMuted: string;
    headingBright: string;
    body: string;
    bodyEmphasis: string;
    cta: string;
    ctaNoteLine1: string;
    ctaNoteLine2: string;
    securityEmphasis: string;
    securityRest: string;
    waitlistHint: string;
    waitlistLink: string;
  };
}

export default function Hero({
  copy,
  referralCode,
  landingTape,
  landingDaily,
}: {
  copy: HeroCopy;
  referralCode: string | null;
  landingTape: unknown;
  landingDaily: unknown;
}) {
  return (
    <section className="relative overflow-hidden py-14 sm:py-24">
      <div aria-hidden="true" className="lp-grid pointer-events-none absolute inset-0" />

      <AmbientCandles />

      <div aria-hidden="true" className="pointer-events-none absolute -top-72 left-1/2 h-[40rem] w-[min(64rem,130vw)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.16),transparent_62%)]" />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            <Zap className="size-3 shrink-0 text-accent" aria-hidden="true" />
            {copy.hero.badge}
          </span>

          <h1 className="mt-6 max-w-2xl text-[2.2rem] sm:text-[2.8rem] lg:text-[3.5rem] font-semibold leading-tight tracking-tight text-white">
            <span className="block text-zinc-400">{copy.hero.headingMuted}</span>
            <span className="block text-white">{copy.hero.headingBright}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
            {copy.hero.body} <span className="text-zinc-200">{copy.hero.bodyEmphasis}</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="/register" variant="primary">
              {copy.hero.cta} <ArrowRight className="ml-2" />
            </Button>

            <p className="text-sm leading-relaxed text-zinc-500">
              {copy.hero.ctaNoteLine1}
              <br className="hidden sm:inline" /> {copy.hero.ctaNoteLine2}
            </p>
          </div>

          <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-zinc-400">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>
              <span className="text-zinc-200">{copy.hero.securityEmphasis}</span> {copy.hero.securityRest}
            </span>
          </p>
        </div>

        <VerdictCard />
      </div>
    </section>
  );
}
