import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Drawdown Recovery Math: Why a 50% Loss Needs a 100% Gain to Break Even · getALPHA" },
  description:
    "The relationship between a loss and the gain needed to undo it isn't 1:1 — it's curved, and it gets steeper the deeper the drawdown goes. What that curve actually looks like, and why it should set your risk limits.",
  alternates: { canonical: "/blog/drawdown-recovery-math" },
};

export default function Page() {
  return (
    <BlogPost title="Drawdown Recovery Math: Why a 50% Loss Needs a 100% Gain to Break Even" date="2026-08-24">
      <p>
        Lose 10% of an account and you need a 11.1% gain to get back to where you started. Lose
        50% and you need 100%. Lose 80% and you need 400%. The relationship between a loss and the
        gain required to undo it is not symmetric, and the gap between the two numbers widens
        faster than most traders expect the deeper a drawdown goes.
      </p>

      <h2>The math itself</h2>
      <p>
        If an account drops by a percentage <em>d</em>, the gain required to return to the starting
        balance is:
      </p>
      <p>
        <em>Recovery % = d / (1 − d)</em>
      </p>
      <p>
        A $10,000 account that drops 20% is left with $8,000. Getting back to $10,000 from $8,000
        is a 25% gain on the smaller balance — not 20%. The loss and the recovery are calculated on
        two different denominators, and that mismatch is the entire reason the curve bends the way
        it does.
      </p>

      <h2>The table that matters more than the formula</h2>
      <ul>
        <li>
          <strong>10% loss</strong> → 11.1% gain to break even
        </li>
        <li>
          <strong>20% loss</strong> → 25% gain to break even
        </li>
        <li>
          <strong>30% loss</strong> → 42.9% gain to break even
        </li>
        <li>
          <strong>50% loss</strong> → 100% gain to break even
        </li>
        <li>
          <strong>70% loss</strong> → 233.3% gain to break even
        </li>
        <li>
          <strong>90% loss</strong> → 900% gain to break even
        </li>
      </ul>
      <p>
        Up to roughly 20%, the gap between the loss and the required recovery is small enough to
        ignore. Past that, it stops being a rounding error and starts being the difference between
        a drawdown you trade out of in a few months and one that takes years, if it happens at all.
      </p>

      <h2>Why this should set a hard floor on risk per trade</h2>
      <p>
        A trader risking 5% per position can hit a 50% account drawdown in fourteen consecutive
        losses — not an implausible run over a few hundred trades, especially with a strategy whose
        win rate is nowhere near 100%. At that point the account needs to double just to get back
        to flat, using the exact same strategy that just produced the losing streak. A trader
        risking 1% per position needs roughly seventy consecutive losses to reach the same 50%
        drawdown, which is a different order of event entirely.
      </p>
      <p>
        This is the actual argument for a hard cap on risk per trade — not because a single 5% loss
        feels dangerous in isolation, but because of what a string of them compounds into, and how
        disproportionately hard that specific hole is to climb back out of.
      </p>

      <h2>What a journal should be checking for</h2>
      <p>
        The number worth watching is not just <strong>current drawdown</strong> — it&apos;s{" "}
        <strong>maximum drawdown reached</strong>, tracked separately, because it is the one that
        tells you what recovery gain you were actually on the hook for at the worst point, even
        after the account has since climbed back. A strategy that touched a 40% drawdown before
        recovering carried a much larger tail risk than its final result shows, and that risk was
        real at the time even if the equity curve now looks fine.
      </p>
      <p>
        Two more numbers worth pulling from the trade record alongside it: the length of the
        losing streak that produced the drawdown, and the average risk per trade during that
        stretch. If the per-trade risk crept up while the streak was happening — a common pattern,
        since a losing run tempts traders to size up to recover faster — that is the mechanism that
        turned a normal losing stretch into a disproportionate hole, and it is worth seeing plainly
        rather than inferring from the final balance.
      </p>
      <p>
        <Link href="/features/trading-journal">getALPHA</Link> tracks running and maximum drawdown
        against your MT5 history automatically, alongside the per-trade risk that produced it, so
        the recovery math above isn&apos;t something you calculate after the fact — it&apos;s a
        number you can see building in real time, while there is still a chance to do something
        about it.
      </p>
    </BlogPost>
  );
}
