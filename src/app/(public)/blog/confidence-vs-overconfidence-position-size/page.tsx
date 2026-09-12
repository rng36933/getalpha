import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute: "Confidence vs. Overconfidence, Measured in Position Size · getALPHA",
  },
  description:
    "Confidence in a setup and confidence in a decision are not the same thing, and only one of them should be allowed to move your position size. How to tell the two apart in your own trade log.",
  alternates: { canonical: "/blog/confidence-vs-overconfidence-position-size" },
};

export default function Page() {
  return (
    <BlogPost title="Confidence vs. Overconfidence, Measured in Position Size" date="2026-09-12">
      <p>
        &ldquo;I was really confident on this one&rdquo; shows up in trade notes right before both
        the best trades in a journal and the worst ones. That&apos;s not a contradiction — it&apos;s
        a sign that &ldquo;confidence&rdquo; is being used to describe two different things, and
        only one of them has any business changing how much size goes on.
      </p>

      <h2>Two things that both get called confidence</h2>
      <p>
        The first is confidence in a setup: a pattern that has shown up in the data before, with a
        known win rate and a known average reward-to-risk, being recognized again. That kind of
        confidence is earned from a sample size and is, in principle, justified — it&apos;s a read on
        the setup, not on the trader.
      </p>
      <p>
        The second is confidence in a decision: a feeling of certainty about this specific trade,
        right now, that has nothing to do with a sample size because it&apos;s a sample of one. It
        often follows a win, or a string of them, and it feels identical from the inside to the
        first kind. The only way to tell them apart is to look at what actually changed —
        the setup, or the trader&apos;s mood.
      </p>

      <h2>Where it shows up: position size</h2>
      <p>
        Confidence in a setup, correctly applied, changes size in a bounded and repeatable way — a
        higher-probability setup earning a slightly larger allocation within a pre-defined range,
        the same way it would have earned that allocation the last ten times it appeared.
        Overconfidence changes size in an unbounded and one-off way: a position two or three times
        the normal risk, justified after the fact by how &ldquo;obvious&rdquo; the trade looked,
        that would not have gotten the same size if it showed up on an ordinary day.
      </p>
      <p>
        The test isn&apos;t whether size increased. It&apos;s whether the increase can be explained by
        something written down before the trade — a rule that gives A-grade setups 1.5% risk
        instead of 1% — or only by how the trade felt once it was already being considered.
        A journal that records size next to the stated reason for that size is the only way to
        catch the difference, because after a winning trade both explanations sound equally
        reasonable.
      </p>

      <h2>The pattern that gives it away</h2>
      <p>
        Pull the position sizes from any account that has gone through a hot streak, and the
        oversized trades cluster in a specific place: shortly after a win, or a run of wins, not
        evenly distributed across the sample. That clustering is the signature of overconfidence
        rather than setup quality, because a genuine edge in a setup doesn&apos;t become more true
        because the last trade happened to work.
      </p>
      <p>
        The same pattern runs in reverse after a loss, and it&apos;s worth checking for both
        directions. A trader who sizes up after wins and sizes down after losses — on the same
        setup, unchanged — is letting the outcome of the last trade set the size of the next one,
        which is the opposite of what position sizing is supposed to do.
      </p>

      <h2>What to check for in your own numbers</h2>
      <ul>
        <li>
          <strong>Does position size correlate with the outcome of the previous trade?</strong> If
          size after a win is reliably larger than size after a loss on the same setup, size is
          being driven by mood, not edge.
        </li>
        <li>
          <strong>Is there a written rule for when size increases?</strong> If the only
          explanation for a larger position is how the trade felt, there isn&apos;t a rule — there&apos;s
          a rationalization.
        </li>
        <li>
          <strong>How wide is the actual range of position sizes used?</strong> A setup-driven
          sizing scheme produces a narrow, bounded range. A mood-driven one produces outliers —
          a handful of trades several times the size of the rest.
        </li>
        <li>
          <strong>Do the oversized trades cluster after wins?</strong> If they do, that&apos;s the
          specific signature of overconfidence rather than a considered exception.
        </li>
      </ul>

      <h2>Why this is hard to catch from memory</h2>
      <p>
        In the moment, a trade sized up after three wins in a row doesn&apos;t feel like a departure
        from the plan — it feels like recognizing an edge that&apos;s working. That&apos;s exactly what
        makes it invisible without a record: the feeling of justified confidence and the pattern
        of unjustified size increase are indistinguishable from inside a single decision, and only
        become separable once size is lined up against the sequence of outcomes that came before
        it.{" "}
        <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s process review checks position
        size against your own history rather than against how a trade felt, so a size increase that
        tracks the last outcome instead of the setup gets flagged as what it is, before it becomes
        the pattern that defines a drawdown.
      </p>
    </BlogPost>
  );
}
