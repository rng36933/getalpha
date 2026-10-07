import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "The Demo-to-Live Performance Gap, and Why It's Not Just Psychology · getALPHA",
  },
  description:
    "A strategy that worked on demo and falls apart live usually isn't a psychology problem in disguise. Fills, latency and size are different too — how to tell which one actually broke.",
  alternates: { canonical: "/blog/demo-to-live-performance-gap" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Demo-to-Live Performance Gap, and Why It's Not Just Psychology"
      date="2026-09-29"
    >
      <p>
        The standard explanation for why a strategy that worked on demo stops working live is
        psychology — fake money doesn&apos;t feel like anything, real money does, and the difference
        in emotion is what wrecks the results. That explanation is true as far as it goes, but it
        also conveniently lets the strategy itself off the hook. A demo account and a live account
        don&apos;t just differ in how a trader feels about them. They differ in fills, latency and
        available size, and any of those can produce a gap on their own with the trader&apos;s
        behavior held constant.
      </p>

      <h2>What actually changes between the two accounts</h2>
      <p>
        A demo account fills every order at the requested price, or close to it, because there is no
        real counterparty to disagree. A live account fills at whatever price is available at the
        moment the order reaches the market, which on a fast-moving instrument can be several pips
        away from the price on the chart when the order was sent. That gap is slippage, and a
        strategy with a tight average target absorbs it differently than one with a wide one — the
        same few pips of slippage can be a rounding error on a 40-pip target and a third of the edge
        on a 10-pip one.
      </p>
      <p>
        Execution speed is the other half of it. A demo fill is effectively instant. A live fill
        depends on the broker&apos;s server, the trader&apos;s connection, and how busy the market is
        at that second — during a news release or a session open, the gap between clicking and
        getting filled can widen well past what it is in quiet conditions. A strategy built around
        entries at a precise level is more exposed to this than one with a wider entry zone, and
        that exposure has nothing to do with discipline.
      </p>
      <p>
        Size is the least-discussed of the three. A demo account can often push far more volume into
        an instrument than the live account&apos;s broker or liquidity actually supports without
        moving the price against the order. A backtest or demo run at a size the live account
        can&apos;t actually get filled at is testing a strategy that doesn&apos;t exist in practice.
      </p>

      <h2>Where psychology actually does explain it</h2>
      <p>
        None of this means psychology is irrelevant — it just isn&apos;t the whole story, and treating
        it as the whole story means the mechanical causes never get checked. The psychological gap
        is real and shows up in specific, recognizable places: stops get moved because the loss is
        now real money, position size gets cut below the plan out of caution, or entries get taken
        early because waiting for full confirmation feels harder when there&apos;s something on the
        line. Those are behavior changes, and they show up as a difference between the plan and what
        was actually executed — not as a difference in the fill price or the time it took to get
        filled.
      </p>

      <h2>How to tell the two apart</h2>
      <p>
        The mechanical causes and the psychological ones leave different fingerprints, and a trade
        log that records more than P&amp;L can separate them:
      </p>
      <ul>
        <li>
          <strong>Compare requested price to fill price.</strong> If live fills are consistently
          worse than the price the trade was meant to enter or exit at, that&apos;s slippage —
          a mechanical cost, not a discipline failure.
        </li>
        <li>
          <strong>Compare planned size to actual size.</strong> If live trades are consistently
          smaller than the plan called for, and it isn&apos;t a broker minimum-size or liquidity
          constraint, that&apos;s hesitation, not execution.
        </li>
        <li>
          <strong>Compare planned stop to actual stop.</strong> A stop that&apos;s wider on live
          trades than it was on demo, with no change in volatility to justify it, points to
          discomfort with the size of a real loss — psychological, not mechanical.
        </li>
        <li>
          <strong>Compare time-in-trade before exit versus the plan&apos;s intended hold.</strong>{" "}
          Closing winners earlier live than the plan specifies, without a corresponding change on
          demo, is a behavior change, not an execution one.
        </li>
      </ul>
      <p>
        A gap that shows up in fill prices and fill speed but not in whether the plan was followed is
        a mechanical problem — the strategy needs to be re-tested with realistic slippage and at a
        size the account can actually fill, not the trader&apos;s discipline. A gap that shows up in
        stops, sizing and hold times while fills stay close to the requested price is a
        psychological one, and no amount of re-testing the strategy will fix it.
      </p>

      <h2>Why most traders never separate them</h2>
      <p>
        Most demo-to-live comparisons stop at the P&amp;L line, which is exactly where the two causes
        look identical — a worse result either way. The only way to tell a mechanical gap from a
        behavioral one is to log the plan alongside the execution: what price, size and stop the
        trade was meant to have versus what it actually got, on both accounts, so the comparison is
        between environments and not just between outcomes.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> logs fills and sizing straight from
        synced MT5 history, and{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> compares planned
        entries and stops against what was actually executed — which is usually enough to show
        whether a demo-to-live gap is coming from the market or from the trader.
      </p>
    </BlogPost>
  );
}
