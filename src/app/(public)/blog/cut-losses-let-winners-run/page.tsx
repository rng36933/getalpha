import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Why \"Cut Losses, Let Winners Run\" Is Bad Advice Without Data · getALPHA",
  },
  description:
    "The rule tells you which direction to lean, not when to act. Without your own numbers behind it, it produces the opposite of what it promises.",
  alternates: { canonical: "/blog/cut-losses-let-winners-run" },
};

export default function Page() {
  return (
    <BlogPost
      title={'Why "Cut Losses, Let Winners Run" Is Bad Advice Without Data'}
      date="2026-08-15"
    >
      <p>
        It is repeated so often that it sounds like a rule. It is not a rule — it is a direction.
        &ldquo;Cut losses&rdquo; does not say at what point a loss is cut. &ldquo;Let winners
        run&rdquo; does not say how far, or what ends the run. Those two missing numbers are
        exactly the decision the phrase is supposed to help with, and without them it gives a
        trader permission to do whatever their mood suggests in the moment, then call it
        discipline afterward.
      </p>

      <h2>The rule has no stopping condition</h2>
      <p>
        A rule you can actually execute needs a trigger: sell when price closes below the
        20-period moving average, or exit if the trade gives back more than half of its open
        profit. &ldquo;Let it run&rdquo; has no such trigger, so in practice it becomes whatever
        the trader feels comfortable holding through — which is a different amount every day,
        depending on how the last few trades went and how much conviction is left after a losing
        week. &ldquo;Cut losses&rdquo; suffers the same problem in reverse: without a predefined
        stop, it turns into cutting whichever losing trade currently feels most uncomfortable to
        watch, which is not the same as the one that has actually invalidated the setup.
      </p>

      <h2>Why it produces the opposite of what it promises</h2>
      <p>
        The failure mode is not that traders ignore the advice — it is that they follow half of
        it. Losses get cut quickly, because a small red number is easy to act on. Winners, held
        with no exit plan, get given back, because there is no signal for when the run is
        supposed to be over — only the vague sense that closing a winning trade feels like
        leaving money on the table. A trade that reaches +2R and drifts back to break-even before
        it is finally closed was &ldquo;let run&rdquo; exactly as instructed, and it still
        contributed nothing to expectancy. A journal that only records win or loss cannot see
        this happen; a journal that records the R-multiple reached before exit sees it on the
        first pass.
      </p>
      <p>
        The reverse pattern shows up just as often: a stop placed too tight, not because the
        setup was invalidated but because the trader wanted to feel like they were &ldquo;cutting
        losses fast,&rdquo; gets hit on ordinary volatility, and the trade would have worked with
        a stop set at the level the setup actually required. Both mistakes get filed under the
        same slogan. Only one of them, measured, looks like discipline.
      </p>

      <h2>What the data actually has to say</h2>
      <p>
        None of this means the underlying idea is wrong — asymmetric reward-to-risk is real and
        it is most of what separates a profitable strategy from a losing one at the same win
        rate. The problem is treating it as an instinct to apply in the moment instead of a rule
        set in advance and checked against results. That means:
      </p>
      <ul>
        <li>
          <strong>A stop-loss placed at the level that invalidates the setup</strong>, decided
          before entry, not moved once the trade is open and losing.
        </li>
        <li>
          <strong>An exit plan for winners defined in R-multiples or a trailing rule</strong>,
          set before entry, so &ldquo;letting it run&rdquo; has an actual mechanism instead of a
          feeling.
        </li>
        <li>
          <strong>The R-multiple reached before exit, logged per trade</strong> — not just
          whether it won, but how much of the move it actually captured relative to the risk
          taken.
        </li>
        <li>
          <strong>How often a stop was hit on ordinary volatility versus genuine invalidation</strong>
          — a pattern only visible across many trades, never from one.
        </li>
      </ul>
      <p>
        Checked this way, the slogan turns from an instinct into something with a track record: a
        trailing rule either captures more R over a large enough sample than a fixed target does,
        or it does not, for a given strategy and instrument. That is a testable question. &ldquo;Let
        your winners run&rdquo; on its own is not.
      </p>

      <h2>Why this needs a record, not a memory</h2>
      <p>
        Nobody remembers accurately how often they cut a winner short versus let it run to plan —
        the trades that worked out feel like proof the instinct is sound, and the ones that
        did not feel like unlucky exceptions. That asymmetry in memory is exactly why this has to
        be measured rather than recalled. <Link href="/features/ai-trade-coach">getALPHA</Link>{" "}
        computes the R-multiple actually captured on every closed trade and reviews exit
        discipline against your own history, so the question of whether letting winners run is
        working is answered from the numbers instead of from how the last few trades felt.
      </p>
    </BlogPost>
  );
}
