import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_PAGES } from "@/lib/features";

export const metadata: Metadata = {
  title: { absolute: "Features · getALPHA" },
  description:
    "Automated trade journaling for MT5, MT4, cTrader and TradingView, an AI trading coach, and a pre-session brief — what getALPHA actually does, one feature at a time.",
  alternates: { canonical: "/features" },
};

export default function FeaturesIndexPage() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold tracking-tight text-white">Features</h1>
      <p className="mt-2 pb-6 text-sm text-muted">
        What getALPHA actually does, one feature at a time.
      </p>

      <ol className="mt-8 space-y-10">
        {FEATURE_PAGES.map((feature) => (
          <li key={feature.slug} className="border-b border-line py-8 first:pt-0 last:border-0 last:pb-0">
            <h2 className="font-mono text-base font-bold text-white">
              <Link href={`/features/${feature.slug}`} className="hover:text-accent">
                {feature.title}
              </Link>
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
              {feature.description}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
