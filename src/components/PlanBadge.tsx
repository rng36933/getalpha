import { navCopy } from "@/lib/i18n/nav";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Which plan the signed-in account is on, printed beside their name.
 *
 * Free is the honest default and is styled as quiet text rather than a warning:
 * most of the product is free, and a Free badge is a statement of fact, not a
 * prompt to upgrade. Only Pro gets the accent, because only Pro is a state the
 * user paid to be in and might reasonably want to confirm at a glance.
 *
 * "Pro" itself is never translated — it is this product's own name for the
 * plan, the same word on the pricing card and the Stripe product, and printing
 * a different word here would make it look like a different plan.
 */
export default function PlanBadge({
  pro,
  locale,
}: Readonly<{ pro: boolean; locale: Locale }>) {
  return (
    <span
      className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase leading-none tracking-wide ${
        pro
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-line bg-surface-raised text-muted"
      }`}
    >
      {pro ? "Pro" : navCopy(locale).planFree}
    </span>
  );
}
