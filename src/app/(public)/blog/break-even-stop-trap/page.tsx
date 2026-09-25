import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      'The Break-Even Stop Trap: When "Protecting Profit" Just Guarantees a Scratch · getALPHA',
  },
  description:
    "Moving a stop to break-even the moment a trade goes green feels like free risk management. Run the numbers on what it actually does to your winners, and it isn't free.",
  alternates: { canonical: "/blog/break-even-stop-trap" },
};

export default function Page() {
  return (
    <BlogPost
      title='The Break-Even Stop Trap: When "Protecting Profit" Just Guarantees a Scratch'
      date="2026-09-26"
    >
      <p>
        Move the stop to entry as soon as the trade is up a bit, and you can&apos;t lose on
        it anymore. That is the entire pitch for a break-even stop, and it is true as far as it
        goes — the specific trade you just did it to can no longer close as a full loss. What
        the pitch leaves out is what happens to the trades that would have kept running, because
        the same rule that protects the downside also puts a ceiling under trades that were never
        going to come back down.
      </p>

      <h2>A break-even stop doesn&apos;t remove risk, it relocates it</h2>
      <p>
        Every trade that reaches a break-even trigger and then pulls back has one of two futures:
        it either continues in your favor after the pullback, or it doesn&apos;t. Moving the stop
        to entry guarantees the second group closes at scratch instead of at a loss — that part
        is real. But it also guarantees that any trade in the first group that dips back to entry
        before resuming gets stopped out at zero, with the rest of the move happening without you
        in it. The rule doesn&apos;t distinguish between a trade that&apos;s about to reverse for
        good and a trade that&apos;s about to give back a third of its gain on the way to twice
        its current size. It treats them identically, which means it&apos;s only free on one of
        them.
      </p>
      <p>
        Spread and commission make this slightly worse than the name suggests. A stop set exactly
        at entry price does not close at 0R once you account for the cost of getting in and the
        cost of getting out — it closes at a small loss on every single trade it touches, winners
        and near-winners included. &ldquo;Break-even&rdquo; is doing some rounding.
      </p>

      <h2>The trades this actually costs you</h2>
      <p>
        The break-even stop&apos;s hidden cost never shows up on the trades it was designed for —
        the ones that go straight to target, or the ones that would have gone to zero anyway. It
        shows up on the trades in between: the ones that ran to 1R, pulled back to test the
        breakout, and then continued to 3R or 4R. A break-even stop closes that trade at scratch
        during the pullback and never sees the 3R. On paper the journal shows a scratch, which
        looks harmless next to a loss. What it actually is is a full winner that got capped, and
        capped winners are exactly the trades that carry a positive-expectancy strategy&apos;s
        average.
      </p>
      <p>
        This is easy to miss because a scratch doesn&apos;t feel like a mistake the way a stopped-out
        loss does. Nobody reviews a 0R trade and asks what went wrong, because nothing visibly
        went wrong — the account is exactly where it was before the trade. The cost is invisible
        precisely because it&apos;s an absence: a trade that should read +3R in the log instead
        reads 0R, and there&apos;s no line item anywhere that says &ldquo;3R not collected.&rdquo;
      </p>

      <h2>Why the intuition is backwards</h2>
      <p>
        The appeal of the break-even stop comes from loss aversion applied to a trade that&apos;s
        already open: once a position is green, giving that unrealized gain back to zero feels
        worse than never having had it, even though a trade sitting at +1R and a trade that never
        opened are not the same position with the same expected value going forward. A trade
        currently up 1R still has whatever expectancy it had at entry, adjusted for the fact that
        price is now closer to a level that mattered to the strategy. Reacting to the unrealized
        gain itself — protecting a number that only exists on screen — is a decision driven by
        how the trade feels, not by where price actually is relative to the plan.
      </p>
      <p>
        The trigger point matters as much as the rule itself. A break-even stop set the moment a
        trade prints +0.3R will get run constantly, by noise the strategy&apos;s own edge already
        priced in as normal movement. Set at +2R after a level has genuinely been cleared, it&apos;s
        a different decision — closer to a trailing stop with one specific step in it than a
        reflexive response to seeing green. The two get talked about as the same technique and
        behave nothing alike in a trade log.
      </p>

      <h2>What to actually track</h2>
      <ul>
        <li>
          <strong>Break-even-stop hit rate</strong> — what fraction of trades that reach your
          trigger get stopped at scratch instead of continuing to target.
        </li>
        <li>
          <strong>MFE on the scratched trades</strong> — how far those specific trades ran after
          being stopped out at break-even, which is the R you actually gave up, not a hypothetical
          one.
        </li>
        <li>
          <strong>Expectancy with the rule on vs. off</strong> — rerun the same trade history
          without moving the stop and compare the two expectancy numbers directly, rather than
          assuming the rule helps.
        </li>
        <li>
          <strong>Trigger distance</strong> — the R multiple at which the stop actually moves,
          logged per trade, since a rule fired at +0.3R and one fired at +2R are not comparable
          and shouldn&apos;t be graded together.
        </li>
      </ul>
      <p>
        Most traders who run this comparison find the break-even stop does exactly what it
        promises on the losing side of the distribution and quietly taxes the winning side, and
        that the net effect on expectancy depends entirely on the trigger distance — not on
        whether the rule exists at all.
      </p>

      <h2>Why this is hard to see without a record</h2>
      <p>
        A scratch doesn&apos;t look like a cost in the moment, and by the time the missed 3R
        would have closed, the trade is already gone from the chart and rarely gets a second
        look.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> logs the maximum favorable
        excursion on every trade pulled from MT5, so a scratch shows up next to how far price
        actually ran afterward, and the process review in{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> checks whether a
        break-even rule is helping or quietly capping the trades that were carrying the strategy.
      </p>
    </BlogPost>
  );
}
