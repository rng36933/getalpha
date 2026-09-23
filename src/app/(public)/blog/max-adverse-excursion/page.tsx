import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Maximum Adverse Excursion: The Number That Shows How Much Heat You Actually Take · getALPHA",
  },
  description:
    "A winning trade that was down 3R before it turned around and a winning trade that never went red are not the same trade. MAE is the number that tells them apart.",
  alternates: { canonical: "/blog/max-adverse-excursion" },
};

export default function Page() {
  return (
    <BlogPost
      title="Maximum Adverse Excursion: The Number That Shows How Much Heat You Actually Take"
      date="2026-09-23"
    >
      <p>
        A trade log records the entry, the exit, and the result. It does not record what happened
        in between — how far the trade went against you before it turned around, if it turned
        around at all. Two winning trades with identical entries, exits and P&amp;L can have taken
        wildly different amounts of heat to get there, and a journal built only from closed prices
        cannot tell them apart.
      </p>

      <h2>What MAE actually is</h2>
      <p>
        <strong>Maximum adverse excursion (MAE)</strong> is the worst unrealized loss a trade
        reaches while it&apos;s open, measured from entry to whichever point the price moved
        furthest against the position before the trade closed. It has nothing to do with how the
        trade ended. A trade that closes at +2R can still have an MAE of −1.8R if price dropped
        that far before reversing — the win rate and the P&amp;L column show a clean win, and the
        MAE is the only number that shows how close it came to being a loss.
      </p>
      <p>
        Expressed in R, so it&apos;s comparable across trades with different stop distances:
      </p>
      <p>
        <em>MAE (R) = worst unrealized loss during the trade ÷ initial risk (entry − stop)</em>
      </p>

      <h2>Why a winning trade can still have a bad MAE</h2>
      <p>
        A trade that goes straight to target and a trade that drops to −1.9R before recovering to
        the same target are the same line in a P&amp;L report and completely different trades in
        every other sense. The second one was one tick from being a stop-out. If that pattern
        repeats — wins that routinely sit deep underwater before turning around — the strategy
        isn&apos;t being saved by good entries, it&apos;s being saved by a stop that happens not to
        get hit, and that&apos;s a coin flip dressed up as a result.
      </p>
      <p>
        This is also where survivorship creeps into a trade log unnoticed: the trades that went to
        −1.9R and kept going show up as losses, sitting right next to the ones that went to −1.9R
        and reversed, which show up as wins. Nothing in the closed P&amp;L distinguishes a system
        that has a real edge from one that&apos;s repeatedly gambling on the same knife-edge
        recovery and only sometimes getting it.
      </p>

      <h2>What it reveals about stop placement</h2>
      <p>
        Plot MAE against the stop distance for a batch of trades and a pattern usually shows up
        fast: either MAE clusters well short of the stop, meaning the stop has slack it doesn&apos;t
        need, or it clusters right up against the stop, meaning the position is one tick of noise
        away from being taken out on trades that would otherwise have worked. Neither is visible
        from win rate or average R — both come from the same summary stats a tighter or looser stop
        would produce, right up until the sample is large enough to separate luck from structure.
      </p>
      <ul>
        <li>
          <strong>MAE consistently small relative to the stop</strong> — the stop is further away
          than the setup actually needs, which caps position size for no risk-reduction benefit.
        </li>
        <li>
          <strong>MAE consistently close to the stop, trade still wins</strong> — the setup is
          being rescued by noise tolerance it doesn&apos;t reliably have; expect this to look worse
          over the next hundred trades than it does over the last hundred.
        </li>
        <li>
          <strong>MAE past where the stop should logically sit</strong> — the stop was moved after
          entry, which means this trade isn&apos;t testing the strategy&apos;s real risk at all.
        </li>
      </ul>

      <h2>The number to log alongside it: MFE</h2>
      <p>
        <strong>Maximum favorable excursion</strong> is the mirror of MAE — the best unrealized gain
        a trade reached before it closed. A trade that peaks at +3R and closes at +0.8R is an exit
        problem, not an entry problem, and it looks identical to a trade that only ever reached
        +0.8R unless MFE is logged separately. Reviewing MAE without MFE tells you how much risk a
        trade actually carried; reviewing both tells you whether the risk was managed well going in
        and whether the reward was captured well going out — two different failure points that a
        single P&amp;L number collapses into one.
      </p>

      <h2>Why this is hard to track by hand</h2>
      <p>
        MAE and MFE both require the price path during the trade, not just the entry and exit
        prices — something a broker statement or a manually kept spreadsheet doesn&apos;t carry.
        Getting either number means pulling tick or bar data for the exact window a position was
        open and finding the extremes within it, trade by trade, which is impractical to do by hand
        past a handful of trades. <Link href="/features/trading-journal">getALPHA</Link> computes
        MAE and MFE automatically from your MT5 history against the market data for each trade&apos;s
        actual open window, so the heat a trade took — and the profit it gave back — shows up next
        to the entry and exit instead of disappearing the moment the position closes.
      </p>
    </BlogPost>
  );
}
