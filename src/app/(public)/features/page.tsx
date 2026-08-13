import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_PAGES } from "@/lib/features";

export const metadata: Metadata = {
  title: { absolute: "Features · getALPHA" },
  description:
    "Automated MT5 trade journaling, an AI trading coach, and a pre-session brief — what getALPHA actually does, one feature at a time.",
  alternates: { canonical: "/features" },
};

export default function FeaturesIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Features</h1>
      <p className="mt-2 text-sm text-muted">
        What getALPHA actually does, one feature at a time.
      </p>

      <ol className="mt-8 space-y-8">
        {FEATURE_PAGES.map((feature) => (
          <li key={feature.slug} className="border-b border-line pb-8 last:border-0">
            <h2 className="text-base font-semibold tracking-tight">
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
