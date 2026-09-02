import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Grading a Trade by Process, Not Outcome: A Practical Scorecard · getALPHA",
  },
  description:
    "P&L tells you what happened. It doesn't tell you whether the trade was any good. A concrete, five-line scorecard for grading a trade on the decision instead of the result.",
  alternates: { canonical: "/blog/grading-a-trade-by-process" },
};

export default function Page() {
  return (
    <BlogPost
      title="Grading a Trade by Process, Not Outcome: A Practical Scorecard"
      date="2026-09-02"
    >
      <p>
        Most traders review a trade by looking at the P&amp;L column first and working backward
        from there — a green number gets a pass, a red one gets picked apart. That is grading the
        dice roll, not the decision. A scorecard fixes this by scoring the same five things on
        every trade, before the outcome gets a vote, so &ldquo;good trade&rdquo; and
        &ldquo;winning trade&rdquo; stop being the same word.
      </p>

      <h2>Why the outcome can&apos;t be one of the criteria</h2>
      <p>
        A stop-loss either sat where the plan put it or it didn&apos;t. A position was either sized
        to the risk rule or it wasn&apos;t. Neither fact changes depending on whether the trade
        closed green or red — the market doesn&apos;t know what your rules were, so it can&apos;t
        grade whether you followed them. Any scorecard that lets the result leak into the score is
        just relabeling P&amp;L with extra steps.
      </p>

      <h2>The five-line scorecard</h2>
      <p>
        Score each line pass or fail, decided only from what was known and done at the time —
        never from how the trade turned out:
      </p>
      <ul>
        <li>
          <strong>Setup criteria met</strong> — the specific conditions the strategy requires were
          actually present, not just &ldquo;close enough&rdquo; to the pattern.
        </li>
        <li>
          <strong>Position sized to the rule</strong> — the size matched the fixed risk percentage
          for the stop distance used, not a size that felt right given recent wins or losses.
        </li>
        <li>
          <strong>Stop placed before entry, at the planned level</strong> — decided by the setup,
          not by how much room the trade &ldquo;deserved&rdquo; once it moved against you.
        </li>
        <li>
          <strong>Entry taken at the signal</strong> — not early on an anticipated move, not late
          chasing a candle that had already closed.
        </li>
        <li>
          <strong>Exit followed the plan</strong> — closed at the target, the stop, or a
          predefined rule (time-based, structure-based), not on a feeling that the move was
          &ldquo;probably done.&rdquo;
        </li>
      </ul>
      <p>
        Five for five is a perfect-process trade. Three for five names, specifically, which two
        habits are costing you — not a vague sense that something felt off.
      </p>

      <h2>What this looks like next to real outcomes</h2>
      <p>
        A trade sized at 4% risk with no stop, entered a candle late because the move already
        looked obvious, that happens to close in profit: one out of five. A trade sized correctly,
        stopped where the plan said, exited at target, that gets stopped out for a loss because the
        market did what markets do sometimes: five out of five. Scored on P&amp;L alone, the first
        trade looks like a win worth repeating and the second looks like a mistake worth avoiding —
        exactly backward from what the numbers underneath them show.
      </p>

      <h2>Score the trend, not the trade</h2>
      <p>
        A single low score is not a crisis; everyone misses a line occasionally. What matters is
        the score averaged across a week or a month, and which specific line is failing most
        often. A score that stays high while P&amp;L is negative points at variance — a sound
        process that hasn&apos;t caught a break yet. A score that drifts down while P&amp;L happens
        to be positive is the more dangerous pattern: it means recent wins are currently paying for
        habits that will eventually stop being lucky.
      </p>

      <h2>Where this breaks down without a record</h2>
      <p>
        Scoring a trade honestly requires knowing, after the fact, what was actually decided
        before entry — the planned stop, the intended size, the signal that triggered it — not
        what memory reconstructs once the outcome is already known. Memory reconstructs
        generously: a stop that got moved starts to feel like it was &ldquo;always going to be
        there,&rdquo; and a late entry starts to feel like it was &ldquo;basically on time.&rdquo;
        A record written down before the result is known is the only version immune to that.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> logs the entry, stop, and size the
        moment a trade closes, and{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> checks each one against your own
        history — so the scorecard gets filled in from what actually happened, not from what the
        outcome makes it convenient to remember.
      </p>
    </BlogPost>
  );
}
