import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "What \"Trading the Plan\" Actually Means, Measured · getALPHA" },
  description:
    "\"I traded the plan\" is a self-report, made after the outcome is already known. What the phrase actually breaks down into, and how to check it against the record instead of the memory.",
  alternates: { canonical: "/blog/trading-the-plan-measured" },
};

export default function Page() {
  return (
    <BlogPost title='What "Trading the Plan" Actually Means, Measured' date="2026-08-20">
      <p>
        Ask a trader after a losing week whether they traded the plan and almost everyone says yes.
        Ask again after a winning week and the answer is the same, just said with more confidence.
        The phrase is doing no work in either case — it is a feeling reported after the outcome is
        already known, not a check performed against anything written down beforehand. &ldquo;The
        plan&rdquo; is usually real. Whether it was followed is usually a guess.
      </p>

      <h2>The phrase has no fixed meaning until the plan is specific</h2>
      <p>
        &ldquo;Traded the plan&rdquo; can only be checked if the plan said something checkable in
        advance: this setup, this entry trigger, this size, this stop, this target or exit rule. A
        plan that says &ldquo;buy strength, sell weakness, manage risk&rdquo; cannot be violated,
        because it does not constrain anything specific enough to violate. Most traders who feel
        confident they stick to a plan are actually sticking to a mood — trading when it feels
        right, sizing what feels comfortable — and the mood agrees with itself by construction. The
        first requirement for measuring adherence is a plan with numbers in it, decided before the
        trade, not a description loose enough to fit whatever already happened.
      </p>

      <h2>What has to be recorded before the trade to check it after</h2>
      <p>
        Checking adherence after the fact needs a record of what was decided before the fact, on
        at least four points:
      </p>
      <ul>
        <li>
          <strong>The setup criteria</strong> that justified entry — not the instrument or
          direction, but the specific condition that made this a trade the plan would take.
        </li>
        <li>
          <strong>Position size</strong>, as a percentage of account risked, decided from the stop
          distance rather than picked to make the trade feel meaningful.
        </li>
        <li>
          <strong>The stop-loss</strong>, at the level that invalidates the setup, set before entry
          rather than added once the trade is already open.
        </li>
        <li>
          <strong>The exit rule</strong> — a target, a trailing rule, or a defined condition for
          closing early — decided with the same clear head as the entry, not improvised once the
          position is moving.
        </li>
      </ul>
      <p>
        None of these need to be complicated. They need to exist in writing, attached to the trade,
        before the outcome makes them easy to rewrite in hindsight.
      </p>

      <h2>Where the gap actually opens</h2>
      <p>
        Deviation from a plan rarely looks like abandoning it outright. It looks like small edits
        made while the trade is live, each one reasonable-sounding on its own: a size bumped up
        because the setup looked unusually clean, a stop nudged out because the level &ldquo;just
        needs a bit more room,&rdquo; an exit taken early because a small profit felt safer than
        letting the plan&apos;s target play out, or a trade taken on a setup that was close enough
        to the criteria rather than actually meeting them. Any one of these, once, is not a broken
        process. The same one repeating across weeks without ever being counted is a plan that
        exists on paper and a different plan that exists in practice — and only a record that
        compares the two, trade by trade, will show which one is actually running the account.
      </p>

      <h2>Measuring adherence instead of recalling it</h2>
      <p>
        Adherence is a rate, not a memory: of the trades taken in a given week or month, how many
        matched the plan on setup, size, stop, and exit — and on the ones that did not, which of
        the four broke, and in which direction. That last part matters more than the headline
        number. A trader whose deviations cluster around moving stops wider has a different problem
        than one whose deviations cluster around cutting winners early, even if both show the same
        overall adherence rate. Averaged across enough trades, this is also the only honest way to
        answer whether a losing stretch was the plan failing or the plan not actually being run —
        two situations that call for opposite fixes, and that feel identical from inside a bad week.
      </p>
      <p>
        This is the specific check{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s process review</Link> is built to run:
        not whether a trade made money, but whether its size and stop matched what the setup called
        for, computed from the account&apos;s own trading history rather than judged by feel after
        the result is already known. Trades sync in from MT5 through a{" "}
        <Link href="/features/trading-journal">read-only add-on</Link>, so the entry, stop, and size
        actually placed are the ones getting checked — not the ones remembered as having been
        placed.
      </p>
    </BlogPost>
  );
}
