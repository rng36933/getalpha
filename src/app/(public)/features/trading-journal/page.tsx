import type { Metadata } from "next";
import Link from "next/link";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = {
  title: { absolute: "Automated Trading Journal for MetaTrader, cTrader & TradingView · getALPHA" },
  description:
    "A trading journal that syncs closed trades straight from MT5, MT4, cTrader or TradingView and computes P&L, risk and reward from your own record — free, no card required.",
  alternates: { canonical: "/features/trading-journal" },
};

export default function Page() {
  return (
    <FeaturePage
      title="Automated Trading Journal for MetaTrader, cTrader & TradingView"
      tagline="Trades sync from your platform. Every number is computed, not typed in."
    >
      <p>
        A trading journal is only as honest as the numbers in it, and a journal you fill in by
        hand is a journal you can flatter — a stop that got moved, a size that got rounded down in
        the retelling. getALPHA&apos;s journal skips that step: a small add-on runs on your
        platform — MT5, MT4, cTrader, or a TradingView alert — and pushes each closed trade to your
        account automatically — entry, exit, size and stop, never typed in by hand.
      </p>

      <h2>What gets computed, not typed</h2>
      <ul>
        <li>
          <strong>P&amp;L</strong>, in your account currency — read from the closed trade, not
          estimated.
        </li>
        <li>
          <strong>Risk taken</strong>, from the stop distance and position size at entry, using the
          symbol&apos;s real contract size rather than assuming one lot is one lot everywhere.
        </li>
        <li>
          <strong>Reward planned</strong>, from any take-profit on the order — and left blank,
          honestly, on the trades that didn&apos;t have one.
        </li>
      </ul>

      <h2>What it doesn&apos;t do</h2>
      <p>
        It doesn&apos;t ask for a broker password — the add-on only sends data outward, and it
        never places or modifies a trade. It doesn&apos;t score a trade&apos;s quality either; that&apos;s
        a separate, judgment-based module (see the{" "}
        <Link href="/features/ai-trade-coach">AI trading coach</Link>). The journal&apos;s job is
        narrower and, on its own, more trustworthy: get the record right, automatically, every
        time.
      </p>

      <h2>Free, no card required</h2>
      <p>
        The journal, the P&amp;L curve, per-pair breakdowns and the economic calendar are free on
        every account. The two AI modules — the coach review and the session brief — are the paid
        part, because they&apos;re the only pieces that cost money to run.
      </p>
    </FeaturePage>
  );
}
