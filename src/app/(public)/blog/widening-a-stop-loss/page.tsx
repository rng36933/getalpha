import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "The Cost of Widening a Stop Loss “Just This Once” · getALPHA",
  },
  description:
    "Widening a stop once doesn't feel like a strategy change. Run the expectancy math and it is one — and it's a change that keeps making itself again.",
  alternates: { canonical: "/blog/widening-a-stop-loss" },
};

export default function Page() {
  return (
    <BlogPost
      title="The Cost of Widening a Stop Loss &ldquo;Just This Once&rdquo;"
      date="2026-08-29"
    >
      <p>
        The stop is set before entry, at 1% risk. Price gets close. The trader gives it another 20
        pips because the level &ldquo;should&rdquo; hold, or the news is about to clear, or it just
        needs a bit more room. Sometimes that trade turns around and closes for a small win. The
        conclusion drawn afterward is almost never &ldquo;I got lucky.&rdquo; It&apos;s
        &ldquo;good thing I didn&apos;t panic and cut it early.&rdquo; That single reframe is the
        whole mechanism — it turns a one-off exception into a technique, and a technique gets used
        again.
      </p>

      <h2>It isn&apos;t a one-time cost</h2>
      <p>
        &ldquo;Just this once&rdquo; describes the intention, not what actually happens. A stop
        moved under pressure once, and rewarded for it, is a stop that will be moved under pressure
        again — the next time the setup looks similarly &ldquo;almost right.&rdquo; The real
        comparison isn&apos;t one planned 1% loss against one widened 2% loss. It&apos;s a planned
        1% risk profile against an actual risk profile that now has an unbounded tail on it,
        applied across every future trade that gets uncomfortable in the same way. The cost is not
        the pips given up on this trade. It&apos;s the strategy quietly becoming a different, worse
        strategy than the one that was backtested or planned.
      </p>

      <h2>What it does to expectancy</h2>
      <p>
        Expectancy is built from an assumed average loss. Widen the stop on a fraction of losing
        trades and that average loss grows, even while the average win and the win rate stay
        exactly where they were:
      </p>
      <p>
        <em>Expectancy = (win rate × average win) − (loss rate × average loss)</em>
      </p>
      <p>
        Take a strategy with a 45% win rate, a 2R average win, and a 1R average loss — a
        comfortably positive edge of 0.35R per trade. Now suppose one loss in five gets widened
        from 1R to 2.5R, because that&apos;s the one where the trader was sure it would turn around.
        Nothing else about the strategy changed — same entries, same win rate, same size of winner.
        The average loss moves from 1R to 1.3R, and expectancy drops to roughly 0.12R per trade: a
        strategy that looked like it was working almost three times as well as it actually was. Keep
        widening one loss in five and the strategy that was profitable on paper is the one now
        losing money in an account, without a single entry signal having changed.
      </p>

      <h2>Why the habit is self-reinforcing</h2>
      <p>
        A widened stop that gets hit anyway confirms nothing — it looks exactly like a normal loss,
        so it teaches nothing and gets forgotten. A widened stop that turns into a win teaches the
        wrong lesson loudly: it feels like discipline rewarded, when it was actually an undefined
        risk that happened to pay off. Because the wins from widening are memorable and the losses
        from it blend into the ordinary loss column, the habit&apos;s own track record looks better
        than it is every time it&apos;s reviewed from memory instead of from the numbers. That
        asymmetry is what keeps the habit alive well past the point it&apos;s costing money.
      </p>
      <p>
        There&apos;s also a compounding effect on the trades that follow. A widened stop that gets
        hit produces a loss two or three times the planned size, which is exactly the situation most
        likely to trigger the next bad decision — sizing up to &ldquo;make it back,&rdquo; or taking
        a marginal setup out of turn. The cost of one widened stop rarely stays contained to the one
        trade it happened on.
      </p>

      <h2>What to actually measure</h2>
      <ul>
        <li>
          <strong>Realized R vs. planned R</strong> on every losing trade — the gap between the
          stop distance at entry and the stop distance the trade actually closed at.
        </li>
        <li>
          <strong>How often it happens</strong>, as a share of losing trades, not as a count of
          isolated incidents.
        </li>
        <li>
          <strong>Expectancy calculated both ways</strong> — with planned risk and with realized
          risk — so the size of the gap is visible as a number, not a feeling.
        </li>
        <li>
          <strong>What follows a widened-and-hit stop</strong> — whether the next trade&apos;s size
          or setup quality changed, which is where the second-order cost usually shows up.
        </li>
      </ul>
      <p>
        None of this requires judging the trade in the moment it happened. It only requires a
        record that keeps the stop at entry alongside the stop the trade actually closed at.
      </p>

      <h2>Why this is easy to miss by hand</h2>
      <p>
        A spreadsheet filled in after the trade closes only has room for the final numbers — the
        stop that mattered, at entry, is already gone by the time anyone writes the row down.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> syncs closed trades directly from
        MT5 and keeps the planned risk alongside the realized one, so the process review in{" "}
        <Link href="/features/ai-trade-coach">getALPHA&apos;s AI coach</Link> can show the actual
        expectancy gap a widened stop is creating, instead of leaving it to be remembered
        selectively.
      </p>
    </BlogPost>
  );
}
