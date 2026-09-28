import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "The Weekend Gap Problem: What Holding Positions Overnight Actually Costs · getALPHA",
  },
  description:
    "A stop-loss only works while the market is open to fill it. What a weekend or overnight gap actually does to a position, and how to see the cost in your own trade log instead of finding out live.",
  alternates: { canonical: "/blog/weekend-gap-problem" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Weekend Gap Problem: What Holding Positions Overnight Actually Costs"
      date="2026-09-18"
    >
      <p>
        A stop-loss is a promise the market only keeps while it&apos;s open. Set a stop 1% below
        entry and, during the trading week, that&apos;s roughly what you lose if it&apos;s hit — the
        market has to trade through your price to fill it. Over a weekend, or any stretch where the
        market is closed, that promise stops applying. Price can open on the other side of your stop
        entirely, and the first fill you get is wherever the market reopens, not wherever you drew
        the line.
      </p>

      <h2>Why a stop doesn&apos;t protect you when the market is closed</h2>
      <p>
        A stop-loss is an order, not a guarantee — it triggers when price trades at that level and
        fills at the next available price. During continuous trading, the next available price is
        usually close to the stop, because there&apos;s a continuous stream of quotes between where
        price was and where the stop sits. Across a close, there is no stream. Friday&apos;s last
        quote and Monday&apos;s first quote can be 40 pips apart, or worse, and everything in between
        never happened as far as your order is concerned. If price gaps past your stop, you get
        filled at the open, and the gap is the difference between what you planned to lose and what
        you actually lost.
      </p>
      <p>
        This isn&apos;t a broker failing to honor an order. It&apos;s the order doing exactly what it
        was told, in a market that moved somewhere your stop never got to intercept.
      </p>

      <h2>What actually causes a gap</h2>
      <p>
        Gaps aren&apos;t random noise — they cluster around a small set of causes, and most of them
        are knowable in advance:
      </p>
      <ul>
        <li>
          <strong>The weekend itself.</strong> Two days of news, data and positioning changes happen
          with no way to react until Sunday&apos;s open, which is why Friday-to-Monday is the single
          most common gap window for retail accounts.
        </li>
        <li>
          <strong>Scheduled events landing after the close.</strong> Central bank decisions, earnings
          releases and major economic data that print outside trading hours reopen the market at a
          different price than it closed at.
        </li>
        <li>
          <strong>Unscheduled news.</strong> The gaps that hurt the most are the ones with no
          calendar entry — geopolitical events, surprise announcements — because there was nothing to
          flag the risk in advance.
        </li>
        <li>
          <strong>Low-liquidity sessions.</strong> Even within a trading day, thin liquidity around
          rollover or between sessions can produce gap-like jumps, just smaller ones.
        </li>
      </ul>

      <h2>What it costs, in the numbers that matter</h2>
      <p>
        The cost of holding through a gap window isn&apos;t the occasional bad weekend — it&apos;s the
        difference between your planned risk and your realized risk, averaged across every position
        you&apos;ve carried through one. A trade sized at 1% risk with a stop that assumes normal
        fill behavior isn&apos;t actually a 1% risk trade if it&apos;s open over a weekend; it&apos;s a
        1% risk trade with an unhedged tail attached. Two numbers make that visible:
      </p>
      <ul>
        <li>
          <strong>Planned loss vs. realized loss on stopped-out trades</strong>, split by whether the
          position was open across a gap window or not. If the gap group&apos;s realized loss is
          consistently worse than planned and the intraday group&apos;s isn&apos;t, that spread is the
          actual cost of holding overnight — not a hypothetical one.
        </li>
        <li>
          <strong>Overnight and weekend swap or financing charges</strong>, which are a separate,
          guaranteed cost layered on top of gap risk. They&apos;re small per night, but a position
          habitually held over multiple weekends pays them repeatedly, and they rarely get netted
          against the P&amp;L people mentally attribute to the trade.
        </li>
      </ul>
      <p>
        Neither number shows up if a trade log only records entry, exit and result. Both require
        knowing which trades were open across a close, which is a field most journals don&apos;t
        track at all.
      </p>

      <h2>What holding overnight is actually a bet on</h2>
      <p>
        Carrying a position through a close isn&apos;t automatically wrong — it&apos;s a specific,
        separate decision from taking the trade in the first place: that the reward from staying in
        is worth accepting a stop that can&apos;t be trusted to hold its price for the duration.
        That&apos;s a reasonable bet for a position sized small enough that a bad gap is tolerable, and
        a bad one for a position sized as if the stop were exact. The failure mode isn&apos;t holding
        overnight — it&apos;s sizing a position the same way regardless of whether it will be, and
        finding out the difference only when a gap actually hits.
      </p>
      <p>
        Concretely, that means the position size math should already account for a worse-than-planned
        fill on anything held across a close — sizing to the stop distance you&apos;d actually get on
        a bad gap, not the one on the chart — rather than treating the stop-loss as equally reliable
        in every market condition it might have to survive.
      </p>

      <h2>Seeing it in your own record</h2>
      <p>
        The only way to know whether weekend and overnight holds are actually costing you is to
        separate them from everything else and look at the numbers on their own — which requires
        knowing, trade by trade, whether a position spanned a market close at all.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s journal pulls that from the
        actual entry and exit timestamps synced from MT5, so gap-exposed trades aren&apos;t buried in
        the same average as everything else, and <Link href="/features/ai-trade-coach">the process
        review</Link> can flag when realized losses on those trades are consistently running past
        what the stop-loss was set to allow.
      </p>
    </BlogPost>
  );
}
