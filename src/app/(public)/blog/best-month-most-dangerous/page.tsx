import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Why Your Best Month Might Be Your Most Dangerous One · getALPHA",
  },
  description:
    "A great month feels like proof the strategy is working. Pull the trade log apart and it's often proof of something else — concentration, size drift, or a streak that hasn't broken yet.",
  alternates: { canonical: "/blog/best-month-most-dangerous" },
};

export default function Page() {
  return (
    <BlogPost title="Why Your Best Month Might Be Your Most Dangerous One" date="2026-09-13">
      <p>
        A losing month gets scrutinised. Every trade gets reread, every stop gets questioned, the
        whole process gets picked apart looking for what went wrong. A best-ever month gets
        screenshotted. Almost nobody opens the log on a green month and asks the same question they
        would ask on a red one: was this actually the process working, or did something else just
        happen to pay off?
      </p>

      <p>
        That asymmetry is the problem. A best month is not dangerous because it happened — it&apos;s
        dangerous because of what it tends to cause next, and because the trade log almost always
        has an answer to &ldquo;why&rdquo; that never gets asked.
      </p>

      <h2>Three different things can produce the same green number</h2>
      <p>
        A month&apos;s total P&amp;L is one number standing in for dozens of decisions. At least three
        very different patterns underneath it all round up to &ldquo;best month ever&rdquo;:
      </p>
      <ul>
        <li>
          <strong>Broad-based performance</strong> — a normal number of trades, position size in
          line with every other month, and the result coming from the same edge that&apos;s been
          there all along, just running a little hot.
        </li>
        <li>
          <strong>Concentration</strong> — most of the month&apos;s gain sitting in one or two trades
          that, if removed, would put the month back around average. The strategy didn&apos;t get
          better; one outlier did the work.
        </li>
        <li>
          <strong>Size drift</strong> — risk per trade creeping up during the month, often without a
          conscious decision to raise it, so the same win rate and the same setups produce a bigger
          number purely because more was staked on each one.
        </li>
      </ul>
      <p>
        Only the first one says anything good about the strategy. The other two are a single lucky
        trade or a risk change wearing a good month&apos;s clothing, and a log that only records
        total P&amp;L by month can&apos;t tell them apart.
      </p>

      <h2>What a best month actually does to the next one</h2>
      <p>
        The financial risk in a great month is usually small — the money is already made. The
        behavioural risk shows up afterward. A best month is exactly the kind of evidence that
        quietly justifies the next three decisions that undo it:
      </p>
      <ul>
        <li>
          Raising size going into the following month, because the bigger number felt like
          confirmation rather than variance.
        </li>
        <li>
          Loosening a rule that had been followed for months — a stop moved wider, a setup filter
          dropped — because the month &ldquo;proved&rdquo; the looser version works.
        </li>
        <li>
          Trading more often to chase the feeling of the month rather than the setups that actually
          produced it, which is how overtrading quietly starts.
        </li>
      </ul>
      <p>
        None of these get decided consciously. They get rationalised after the fact by a result that
        was never checked for where it actually came from.
      </p>

      <h2>How to check your own best month</h2>
      <p>
        The check doesn&apos;t require anything exotic, just the same numbers you&apos;d pull after a bad
        month, pointed at a good one:
      </p>
      <ul>
        <li>
          <strong>Remove the single best trade</strong> and recompute the month&apos;s P&amp;L. If the
          result drops from best-ever to ordinary, the month was concentration, not edge.
        </li>
        <li>
          <strong>Plot risk per trade across the month.</strong> A flat line means the result came
          from the setups. A rising one means the result came partly from bigger bets on the same
          setups — which is a risk change, not a performance improvement.
        </li>
        <li>
          <strong>Compare trade count and average hold time</strong> to your usual month. A spike in
          either is a sign the process changed, even if nobody decided to change it.
        </li>
        <li>
          <strong>Check expectancy, not just P&amp;L.</strong> A real improvement in edge shows up as
          a better average win-to-loss ratio across a normal number of trades. A result driven by
          size or one outlier won&apos;t move expectancy at all.
        </li>
      </ul>
      <p>
        If the best month passes all four checks, it&apos;s a genuine data point — worth trusting, and
        worth sizing into a little. If it fails one or two, the useful conclusion isn&apos;t &ldquo;don&apos;t
        trust good months&rdquo; — it&apos;s knowing which part of this one not to repeat on purpose.
      </p>

      <h2>Why this is easy to miss in your own numbers</h2>
      <p>
        The reason this check rarely happens on your own account is the same reason a loss gets
        scrutinised and a win doesn&apos;t: a good outcome doesn&apos;t feel like it needs explaining.{" "}
        <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s process review runs the same
        read on every month regardless of how it closed — concentration, size drift and expectancy
        computed from the trades themselves, so a best month gets the same scrutiny as a worst one,
        before either gets turned into a decision about next month.
      </p>
    </BlogPost>
  );
}
