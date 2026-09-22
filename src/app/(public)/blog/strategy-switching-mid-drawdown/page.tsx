import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "What Changing Your Strategy Mid-Drawdown Really Costs You · getALPHA",
  },
  description:
    "Switching strategies during a losing stretch feels like fixing the problem. Usually it resets the sample size on both strategies and hides which one actually failed.",
  alternates: { canonical: "/blog/strategy-switching-mid-drawdown" },
};

export default function Page() {
  return (
    <BlogPost
      title="What Changing Your Strategy Mid-Drawdown Really Costs You"
      date="2026-09-22"
    >
      <p>
        Five losses in a row and the strategy that looked fine last week suddenly looks
        broken. The instinct is to do something about it — tighten the rules, switch
        setups, try the system a friend has been posting about. It feels like taking
        action. What it actually does, most of the time, is throw away the one thing that
        could have told you whether the strategy was broken in the first place: a sample
        size large enough to know.
      </p>

      <h2>A drawdown and a broken strategy look identical from inside one</h2>
      <p>
        A strategy with a real edge still loses money in stretches — that is what a 40%
        win rate with a positive expectancy looks like in practice. String enough losses
        together and it is indistinguishable, in the moment, from a strategy that stopped
        working. The only way to tell them apart is to keep the sample going: did this
        drawdown stay inside the range the backtest or the live history already showed, or
        has it gone past it. Switching strategies at trade twelve of a losing streak
        answers a question you never actually asked — you skip straight to a new system
        without finding out whether the old one was still fine.
      </p>

      <h2>The switch resets the clock on both strategies</h2>
      <p>
        Here is the part that is easy to miss: abandoning strategy A mid-drawdown doesn&apos;t
        just stop the bleeding on A. It also means strategy B starts its own sample from
        zero, evaluated by someone who is already down money and in no state to sit through
        B&apos;s first losing stretch either. If B has a real edge, it will have its own
        string of losses eventually — and by the same logic that ended A, that stretch will
        look like proof B is broken too. A trader running this pattern isn&apos;t testing
        strategies. They are testing how many trades it takes before they quit, and it is
        usually a smaller number than either strategy actually needed to prove itself.
      </p>

      <h2>What the switch is actually optimizing for</h2>
      <p>
        The honest reason to change strategy mid-drawdown is rarely &ldquo;the data says
        this one is broken.&rdquo; It is that the losing streak is uncomfortable and doing
        something makes the discomfort feel addressed. Those are different problems with
        different fixes. The data question has an answer you can check against the
        strategy&apos;s own history — sample size, current drawdown versus historical
        maximum, whether losses are clustering somewhere specific. The discomfort question
        doesn&apos;t get solved by switching strategies; it gets solved by having a rule
        decided before the drawdown started, so the decision to hold or stop isn&apos;t
        being made by whoever is in the room after ten losses.
      </p>

      <h2>What to check before switching, not after</h2>
      <ul>
        <li>
          <strong>Sample size so far</strong> — how many closed trades this strategy has
          actually produced. A ten-trade sample can&apos;t confirm or rule out anything;
          the drawdown you&apos;re reacting to may simply be too small to mean much yet.
        </li>
        <li>
          <strong>Current drawdown vs. historical maximum</strong> — if the backtest or
          prior live run already showed a losing streak this long or longer, this one is
          inside the expected range, not outside it.
        </li>
        <li>
          <strong>Where the losses are concentrated</strong> — spread across setups and
          conditions, or clustered in one session, one instrument, or one market regime
          that has genuinely changed since the strategy was built.
        </li>
        <li>
          <strong>Whether execution matched the plan</strong> — a drawdown caused by
          skipped stops, widened stops, or size creep isn&apos;t evidence against the
          strategy at all. It&apos;s evidence against the execution of it.
        </li>
      </ul>
      <p>
        Only the last two are actual arguments for change, and neither one is solved by
        switching to an unrelated system — they&apos;re solved by fixing the regime
        assumption or the execution, which a full switch doesn&apos;t touch.
      </p>

      <h2>Why this is hard to see while it&apos;s happening</h2>
      <p>
        In the moment, a losing streak feels like new information arriving continuously,
        and each fresh loss feels like it should update the verdict on the strategy. Pulled
        back into a full trade history, most of those streaks sit well inside a range the
        strategy had already shown before — the information wasn&apos;t new, it just felt
        that way one trade at a time.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> keeps every strategy&apos;s
        results separated and synced from MT5, so a current drawdown can be checked
        against that strategy&apos;s own historical range instead of against a gut feeling,
        and the process review in{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> flags when a
        losing stretch is coming from execution drift rather than the strategy itself —
        which is exactly the distinction that gets lost in the moment a switch feels
        tempting.
      </p>
    </BlogPost>
  );
}
