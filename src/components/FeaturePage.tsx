"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { gtagEvent } from "@/lib/analytics/ga-client";

type FeaturePageProps = {
  title: string;
  tagline: string;
  children: React.ReactNode;
};

/**
 * Shared chrome for a feature page, mirroring `BlogPost`.
 *
 * Same reasoning: one component keeps every feature page reading as one set
 * rather than each one improvising its own layout.
 */
export default function FeaturePage({ title, tagline, children }: FeaturePageProps) {
  return (
    <article>
      <Link href="/features" className="text-xs text-muted hover:text-accent">
        ← Features
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted">{tagline}</p>

      <div className="prose-blog mt-8 space-y-5 text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline-offset-2 [&_a:hover]:underline [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-accent">
        {children}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-white/[0.02] p-6">
        <p className="text-sm font-semibold text-foreground">
          Start your free journal
        </p>
        <p className="mt-1 text-sm text-muted">
          Free to sync trades from MT5, MT4, cTrader or TradingView and see your P&amp;L, risk and calendar. No card required.
        </p>
        <div className="mt-4">
          <Button href="/register" variant="primary" onClick={() => gtagEvent("cta_click", { location: "feature_page" })}>
            Start free
          </Button>
        </div>
      </div>
    </article>
  );
}
