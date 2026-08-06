import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "R-Multiple vs. P&L: Why One Number Travels and the Other Doesn't · getALPHA" },
  description:
    "P&L tells you what a trade was worth in currency. R-multiple tells you what it was worth relative to the risk you took. Only one of those numbers is comparable across trades.",
  alternates: { canonical: "/blog/r-multiple-vs-pnl" },
};

export default function Page() {
  return (
    <BlogPost title="R-Multiple vs. P&L: Why One Number Travels and the Other Doesn't" date="2026-08-06">
      <p>
        A $400 win and a $40 win look different in a P&amp;L column. If the first trade risked $800
        and the second risked $20, the second was the better trade — it returned twice its risk
        while the first returned half of it. P&amp;L alone can&apos;t show you that, because it never
        records what was at stake to begin with.
      </p>

      <h2>What R-multiple actually measures</h2>
      <p>
        R-multiple expresses a trade&apos;s result as a multiple of the amount risked, not as a
        currency figure:
      </p>
      <p>
        <em>R-multiple = P&amp;L ÷ initial risk (entry minus stop, in account currency)</em>
      </p>
      <p>
        Risk $100 and make $250, and the trade is <strong>+2.5R</strong> — regardless of whether the
        account is $2,000 or $200,000. Risk $100 and lose the full stop, and it is{" "}
        <strong>−1R</strong> by definition. The moment risk is fixed as the denominator, results from
        different position sizes, different instruments, and different account sizes all land on
        the same scale.
      </p>

      <h2>Why P&L doesn't travel</h2>
      <p>
        A currency figure only means something next to the risk that produced it, and a raw
        P&amp;L column strips that context out. Two failure modes hide inside it:
      </p>
      <ul>
        <li>
          <strong>Size drift.</strong> A trader who doubles position size after a losing streak — to
          &ldquo;make it back&rdquo; — can post a string of green P&amp;L numbers that look like a
          turnaround, while the R-multiples underneath show the same edge, larger bets, and more
          exposure to the next loss.
        </li>
        <li>
          <strong>Cross-instrument comparison.</strong> $50 on a micro lot and $50 on a full lot are
          not the same trade. Without the risk each one was struck against, P&amp;L can&apos;t tell them
          apart, and a review built on P&amp;L ends up averaging numbers that were never on the same
          scale to begin with.
        </li>
      </ul>
      <p>
        R-multiple doesn&apos;t fix position sizing on its own, but it makes it visible — a widening
        spread of R outcomes with a constant intended risk is a size-discipline problem you can see
        in the data, not just suspect.
      </p>

      <h2>What this changes about reviewing a session</h2>
      <p>
        Once results are in R, three questions become answerable that a P&amp;L total can&apos;t
        answer on its own:
      </p>
      <ul>
        <li>
          <strong>Average R per trade</strong> — the expectancy of the process itself, independent of
          how big any single position happened to be.
        </li>
        <li>
          <strong>Distribution of R</strong> — whether wins cluster near the planned target or get
          cut short at +0.3R while losses regularly run past −1R, which P&amp;L hides inside an
          otherwise fine-looking total.
        </li>
        <li>
          <strong>Best and worst R, not best and worst P&amp;L</strong> — the single largest dollar
          loss might be a correctly-sized 1R stop on a big position, while the real outlier — a
          trade held past its stop — shows up as a −4R the currency total alone wouldn&apos;t flag.
        </li>
      </ul>

      <h2>Where it fits alongside P&L, not instead of it</h2>
      <p>
        P&amp;L is still the number that pays the bills, and a strategy with a strong average R but
        a tiny account risking pennies per trade isn&apos;t going anywhere. The two answer different
        questions: P&amp;L says what the account did, R-multiple says whether the process behind it
        is sound and repeatable. A journal that only tracks one is missing half the picture.
      </p>
      <p>
        This is why <Link href="/">getALPHA</Link> computes R-multiple on every synced trade
        automatically, from the stop-loss and entry the broker actually recorded, rather than
        leaving it as a figure to calculate by hand after the fact — the same gap that makes manual
        risk tracking easy to round in your own favor without meaning to.
      </p>
    </BlogPost>
  );
}
