import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Trading Plan vs. Trading Rules: Why Most Traders Confuse the Two · getALPHA" },
  description:
    "A trading plan and a set of trading rules are not the same document, and treating them as one is why most plans never get followed. What each one is actually for, and how to check whether yours has both.",
  alternates: { canonical: "/blog/trading-plan-vs-trading-rules" },
};

export default function Page() {
  return (
    <BlogPost title="Trading Plan vs. Trading Rules: Why Most Traders Confuse the Two" date="2026-09-10">
      <p>
        Ask a trader for their &ldquo;plan&rdquo; and most will hand over one document that tries to be
        both a strategy description and a list of constraints at the same time. It reads like a
        plan and gets followed like a suggestion, because a plan and a set of rules are actually
        two different things, and only one of them is enforceable.
      </p>

      <h2>What a plan actually is</h2>
      <p>
        A trading plan describes <strong>how you intend to trade</strong>: which setups you take,
        what timeframe you trade them on, what market conditions you avoid, how you size a
        position. It is a description of a strategy, and like any description it has judgment
        built into it — &ldquo;trade pullbacks in a clear trend&rdquo; still requires you to decide, in
        the moment, whether the trend is clear enough. A plan can be well-reasoned and still leave
        room to talk yourself into a trade it never actually called for.
      </p>

      <h2>What a rule actually is</h2>
      <p>
        A rule is not a description, it is a constraint with a binary check: either it was followed
        or it wasn&apos;t, and there is no reading of the trade log where that&apos;s ambiguous.
        &ldquo;Trade pullbacks in a clear trend&rdquo; is plan language. &ldquo;No new position if daily
        loss exceeds 2% of account equity&rdquo; is a rule — it doesn&apos;t require judgment to check,
        it requires one number compared against another. That difference is the whole point of
        having rules at all: a plan tells you what a good trade looks like, a rule tells you when
        you are not allowed to take one, full stop.
      </p>
      <p>
        A useful test for whether something is a rule or just plan language dressed up as one: can
        two different people, looking at the same trade log, agree on whether it was broken? If the
        answer depends on judgment — how strong the trend looked, how confident the setup felt —
        it&apos;s plan language. If the answer is a lookup against a number, it&apos;s a rule.
      </p>

      <h2>Why the confusion is expensive</h2>
      <p>
        Most traders who say they &ldquo;broke their plan&rdquo; after a bad trade didn&apos;t actually
        break anything checkable — they made a discretionary call that, in hindsight, was wrong.
        That&apos;s a different failure than blowing through a hard stop or doubling size after a
        loss, but a journal that only tracks &ldquo;followed the plan: yes/no&rdquo; records both the
        same way. The second one is the one that compounds into account-ending drawdowns; the
        first one is closer to normal variance in a discretionary strategy. Collapsing them into
        one soft category is how a trader ends up unable to tell whether a losing week was bad luck
        or a real breach.
      </p>
      <p>
        The other cost shows up in review. A plan gets revised — that&apos;s expected, strategies
        evolve as you learn what actually works. But if rules get revised with the same casualness,
        &ldquo;the plan changed&rdquo; quietly becomes the explanation for every rule that got broken,
        and a risk limit that moves whenever it&apos;s inconvenient was never really a limit.
      </p>

      <h2>Keeping the two separate on paper</h2>
      <ul>
        <li>
          <strong>Write rules as numbers, not descriptions.</strong> Max risk per trade, max daily
          loss, max open positions, minimum reward-to-risk before a trade qualifies — each one
          should be a threshold you could check with a calculator, not a sentence you could argue
          about.
        </li>
        <li>
          <strong>Keep rules short and few.</strong> A list of forty rules is a plan wearing a
          rule&apos;s clothing — nobody tracks forty binary checks consistently, and a rule you don&apos;t
          actually check is a rule you don&apos;t have.
        </li>
        <li>
          <strong>Log rule breaks separately from plan deviations.</strong> A trade that didn&apos;t
          fit the setup criteria is a judgment call worth reviewing. A trade placed after a daily
          loss limit was hit is a different category of problem and should never get averaged into
          the same &ldquo;discipline score.&rdquo;
        </li>
        <li>
          <strong>Revise the plan often, revise the rules rarely.</strong> If a risk rule needs
          changing more than once a quarter, the number was probably wrong to begin with, not the
          market.
        </li>
      </ul>

      <h2>Checking it against the record</h2>
      <p>
        The only real test of whether a rule is actually a rule is whether it shows up as a clean
        breach in the trade log without you having to explain the context. <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s
        process review checks position size, stop placement and exposure against fixed thresholds
        for exactly this reason — it flags the daily loss limit that got breached and the position
        that exceeded max risk as what they are, separately from the discretionary calls that just
        didn&apos;t work out, so the two don&apos;t get graded on the same curve.
      </p>
    </BlogPost>
  );
}
