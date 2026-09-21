import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "What Changing Your Strategy Mid-Drawdown Really Costs You · getALPHA",
  },
  description:
    "Swapping strategies while one is underwater feels like fixing the problem. Usually it just resets the sample size on the old strategy and starts a new, unproven one at the worst possible time.",
  alternates: { canonical: "/blog/changing-strategy-mid-drawdown" },
};

export default function Page() {
  return (
    <BlogPost
      title="What Changing Your Strategy Mid-Drawdown Really Costs You"
      date="2026-09-21"
    >
      <p>
        A strategy is down eight trades and 6% of the account. It has not been given up on so much
        as quietly set aside — attention moves to a different setup, one that has been working
        lately, or one read about last week that looks cleaner right now. This does not feel like
        abandoning a system. It feels like doing something about the problem instead of sitting
        through it. The two things it actually does are less flattering: it throws away the sample
        the old strategy needed to prove itself either way, and it puts a strategy with no track
        record at all in charge of digging out of the hole.
      </p>

      <h2>The switch answers nothing about the strategy you left</h2>
      <p>
        A drawdown only tells you something once it runs long enough to separate variance from a
        genuine break in edge — that is true whether the strategy stays broken or turns out fine.
        Switching away at trade eight doesn&apos;t answer that question, it just stops asking it. The
        strategy exits the sample forever undetermined: not proven broken, not proven sound, just
        abandoned at the exact point where the data was least conclusive. If it was actually still
        working, the recovery that would have shown that never gets recorded. If it was actually
        broken, nothing was learned that would stop the same strategy from getting picked back up
        in three months when memory of the drawdown has faded.
      </p>
      <p>
        Either way, the eight losing trades are now a closed, unexplained chapter instead of the
        middle of an answer. That is a worse outcome than sitting through a losing stretch and
        confirming it was broken — because at least that gives you a reason not to trade it again.
      </p>

      <h2>The new strategy starts with zero track record, at full size</h2>
      <p>
        The strategy being switched to almost never gets treated like the untested thing it is. It
        gets sized the same as the old one — often the same 1% risk per trade, sometimes more,
        because the account is down and there is an unspoken urge to make the recovery faster. But
        the old strategy earned that size through some number of trades that showed it held up. The
        new one hasn&apos;t. Trading an unvalidated setup at a validated size is the same mistake as
        trading a validated setup with the stop widened — the risk being taken no longer matches the
        evidence behind it, and the evidence is now thinner than it has been at any point since the
        account was opened.
      </p>
      <p>
        This is also, usually, the worst possible moment to be running an unproven strategy. The
        account is already below its starting equity, which means every trade result now compounds
        against a smaller base:
      </p>
      <p>
        <em>Recovery % needed = drawdown % ÷ (1 − drawdown %)</em>
      </p>
      <p>
        An account down 6% needs about 6.4% back to break even. That gap only widens with each
        further loss. Handing that math to a strategy with no track record, at the size a proven one
        earned, is a bet that the new setup performs well immediately — not eventually, immediately —
        with no evidence either way that it will.
      </p>

      <h2>What the pattern usually looks like in the data</h2>
      <p>
        A trade log that has been through a few strategy switches tends to show the same shape every
        time: a cluster of losses on Strategy A, a switch, a short run on Strategy B that either
        works for a while or doesn&apos;t, and then — if it doesn&apos;t — either a switch back to
        Strategy A or on to Strategy C. What is missing from that picture is any single strategy that
        was ever run long enough, at a consistent size, to say with any confidence whether it had a
        real edge. The account isn&apos;t running multiple strategies. It&apos;s running fragments of
        several, none of which ever got a fair test, stitched together by whichever one happened to
        be under review during the worst week of the last one.
      </p>
      <p>
        The tell is usually recency: the strategy switched to is almost always one that performed
        well recently, which is exactly the state a strategy is in right before its own drawdown, not
        after it. Switching into recent strength and out of recent weakness is a way of consistently
        buying strategies at their local peak and selling them at their local trough — the opposite
        of what the switch is meant to accomplish.
      </p>

      <h2>What to check before switching, and what to log if you do</h2>
      <ul>
        <li>
          <strong>Sample size on the strategy being left</strong> — how many trades has it actually
          run, and is the current drawdown long enough, relative to its own historical variance, to
          say anything about whether it broke.
        </li>
        <li>
          <strong>Track record on the strategy being switched to</strong> — a real one, from this
          account&apos;s own history, not a backtest or a strategy that looked good on someone
          else&apos;s feed.
        </li>
        <li>
          <strong>Size assigned to the new strategy</strong> — whether it matches the size the old
          one earned, or was cut down to reflect that it has proven nothing yet.
        </li>
        <li>
          <strong>The switch itself, as a dated entry</strong> — which strategy stopped, which one
          started, and the account equity at that exact point, so a later review can see whether
          switching helped or just moved the drawdown onto a different label.
        </li>
      </ul>
      <p>
        None of this argues for riding out every losing strategy forever. Some are genuinely broken
        and the sooner that is confirmed the better. The argument is narrower: a switch made
        <em> because</em> of the drawdown, without checking whether the sample was long enough to
        justify it, replaces one undetermined problem with a second one — and does it at reduced
        capital.
      </p>

      <h2>Why this is hard to catch without a record</h2>
      <p>
        In the moment, a strategy switch feels like a decision. In the trade log it&apos;s
        indistinguishable from any other run of trades unless the switch itself is written down —
        which is exactly what usually doesn&apos;t happen, because writing down &ldquo;I&apos;m
        giving up on this for now&rdquo; is not a satisfying thing to log.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> keeps every synced trade tagged and
        timestamped against the account&apos;s full history, so a strategy change shows up as a
        visible break in the data instead of disappearing into the run of trades around it, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> can flag when position size on a
        new setup doesn&apos;t match the sample size behind it.
      </p>
    </BlogPost>
  );
}
