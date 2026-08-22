import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "The Cost of Revenge Trading, In Real Numbers · getALPHA",
  },
  description:
    "Revenge trading doesn't feel like a decision — it feels like getting even. What it actually costs, measured from the trades that follow a loss instead of from the feeling.",
  alternates: { canonical: "/blog/cost-of-revenge-trading" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Cost of Revenge Trading, In Real Numbers"
      date="2026-08-22"
    >
      <p>
        Nobody logs a trade as &ldquo;revenge.&rdquo; It gets logged as a normal entry, on a normal
        setup, with a normal reason in the notes field if there is one at all. The only thing that
        marks it apart is timing: it happened minutes after a loss, sized bigger than the trade
        before it, on a setup that would not have cleared the bar on any other day. Nothing in a
        standard trade log captures that. The row looks identical to every other row.
      </p>

      <h2>What counts as revenge trading, precisely</h2>
      <p>
        Not every trade taken after a loss is revenge trading — closing one trade and opening the
        next valid setup twenty minutes later is just trading. The pattern worth measuring is
        narrower: a new position opened <strong>quickly</strong> after a loss, sized{" "}
        <strong>larger</strong> than the position before it, without a corresponding setup that
        would have justified the size on its own. The speed and the size are the tell. The setup
        quality, if you look honestly, is usually the giveaway underneath both — a trade taken to
        make the account whole again, not because the chart offered anything new.
      </p>

      <h2>Why it is expensive beyond the loss itself</h2>
      <p>
        The direct damage is the easy part to see: a bigger position than the plan called for,
        taken on a lower-quality setup, has worse expectancy than either factor alone would
        suggest. But the compounding part is what actually does the damage over a month. A revenge
        trade that also loses does not reset the emotional state — it deepens it, which raises the
        odds that the next trade after it is sized even larger, on an even thinner justification.
        One bad trade taken in that state rarely stays one bad trade. It tends to run in short,
        escalating sequences, and the sequence is where an account takes real damage, not the
        first trade in it.
      </p>
      <p>
        The size increase alone is worth isolating. A trader risking a consistent 1% per trade who
        jumps to 2&ndash;3% on the trade immediately following a loss is not doubling their
        expectancy — the setup quality did not double, only the size did. Expectancy scales with
        the quality of the decision, not with how much is riding on it. Sizing up on a worse
        decision is pure downside with no corresponding upside to offset it.
      </p>

      <h2>Why outcome hides the pattern instead of revealing it</h2>
      <p>
        The reason revenge trading survives in a trader&apos;s process for years is that it does
        not lose every time. Some revenge trades win, and a win closes the loop emotionally in a
        way that feels like proof it was fine — &ldquo;I got it back.&rdquo; That single winning
        trade is remembered. The three or four losing ones taken in the same state, on the same
        kind of day, are not remembered with the same weight, because each one individually felt
        like an isolated bad break rather than part of a pattern. Outcome-based memory is
        selective in exactly the direction that keeps the habit alive.
      </p>
      <p>
        This is the same trap covered in{" "}
        <Link href="/blog/why-win-rate-doesnt-matter">why win rate doesn&apos;t matter</Link>: a
        trade&apos;s outcome and the quality of the decision behind it are two different things,
        and grading by outcome alone teaches the wrong lesson roughly as often as the right one.
        Revenge trading is the clearest case of that gap, because the decision quality is often
        visibly worse in the moment and the outcome still sometimes rewards it anyway.
      </p>

      <h2>What to actually measure</h2>
      <ul>
        <li>
          <strong>Time between trades</strong>, specifically the gap right after a loss compared
          to the gap after a win — a shrinking gap after losses is the earliest signal, well
          before size or setup quality show anything unusual.
        </li>
        <li>
          <strong>Position size following a loss</strong>, measured against your own average size,
          not against the plan you wrote — the plan says what should happen; this says what
          actually does.
        </li>
        <li>
          <strong>Expectancy of trades taken within, say, 15 minutes of a loss</strong>, isolated
          from the rest of the sample. If that subset&apos;s numbers are meaningfully worse than
          the account&apos;s overall expectancy, the pattern is costing real money, not just
          feeling uncomfortable.
        </li>
        <li>
          <strong>Loss streak length before a break was actually taken</strong> — not whether a
          rule existed on paper, but whether it was followed on the days it mattered.
        </li>
      </ul>
      <p>
        None of these require guessing at what was going through your head. They only require
        comparing timestamps and sizes against your own baseline, which is exactly the kind of
        comparison a memory optimized to forget the losing streak will not make on its own.
      </p>

      <h2>Why this is hard to catch in the moment it matters</h2>
      <p>
        The state that produces a revenge trade is also the state that is worst at noticing it is
        happening — by definition, a trader who could step back and see the pattern clearly would
        not be in it. Catching this after the fact, from the record, is the only version of the
        check that does not depend on having a clear head at the exact moment a clear head is
        hardest to have.{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> flags exactly this
        shape — size and timing relative to a recent loss, checked against your own history — and{" "}
        <Link href="/features/session-brief">the session brief</Link> surfaces it before the next
        session starts, so the pattern shows up as a number to look at instead of a feeling to
        argue with.
      </p>
    </BlogPost>
  );
}
