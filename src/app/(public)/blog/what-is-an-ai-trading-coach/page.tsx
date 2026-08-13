import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "What Is an AI Trading Coach (And What It Isn't) · getALPHA" },
  description:
    "The phrase covers two very different products — one that guesses where price goes next, and one that reads what you already did. Only one of them can actually be checked.",
  alternates: { canonical: "/blog/what-is-an-ai-trading-coach" },
};

export default function Page() {
  return (
    <BlogPost title="What Is an AI Trading Coach (And What It Isn't)" date="2026-08-10">
      <p>
        &ldquo;AI trading coach&rdquo; gets used for two products that have almost nothing in
        common. One reads the market and tells you what to do next. The other reads what you
        already did and tells you whether it was sound. They get marketed with the same three
        words, and the difference between them is the only thing worth knowing before you trust
        either one.
      </p>

      <h2>The kind that predicts, and the kind that reviews</h2>
      <p>
        A prediction tool takes price and volume in and produces a signal out — buy here, sell
        there, confidence 78%. Whatever is happening inside it, the claim is about the future, and
        the future is the one thing no model can be checked against until it has already happened.
        By the time you know whether it was right, you have already acted on it.
      </p>
      <p>
        A review tool takes a trade you already closed and tells you whether the decision behind
        it held up — was the size defensible, was the stop set before entry, did the exit match
        the plan. Nothing here is a claim about tomorrow. It is a claim about a number that already
        exists, which means it can be checked the same day it is made, against the same record it
        was computed from.
      </p>

      <h2>What gets computed and what gets judged</h2>
      <p>
        The distinction that actually matters isn&apos;t &ldquo;does it use AI&rdquo; — almost
        everything claims that now. It&apos;s where the arithmetic happens. Risk as a percentage of
        equity, planned reward-to-risk, how far an exit landed from a stated target — those are
        computed in code, the same way every time, from the trade record itself. A model never
        touches that step, because a model doesn&apos;t need to: it&apos;s division.
      </p>
      <p>
        What a model is actually useful for is reading the finished numbers in context and writing
        the sentence a spreadsheet can&apos;t: <em>this size was defensible on the first two trades of
        the week and reckless by the fourth.</em> That&apos;s a judgment call across a pattern, not an
        arithmetic operation, and it&apos;s also the one place a language model belongs in this
        pipeline — after the numbers exist, not instead of them.
      </p>

      <h2>The five things worth judging on any one trade</h2>
      <ul>
        <li>
          <strong>Trade selection</strong> — whether the setup matched a pattern in your own
          history that has actually worked, not just one that felt familiar.
        </li>
        <li>
          <strong>Position sizing</strong> — risk as a share of equity, checked against your own
          median, not a generic &ldquo;1% rule&rdquo; that ignores what you actually trade.
        </li>
        <li>
          <strong>Stop placement</strong> — set before entry or not, and how far it sat from the
          level that would have invalidated the idea.
        </li>
        <li>
          <strong>Exit management</strong> — whether the close matched the planned target, or
          drifted based on how the trade felt while it was open.
        </li>
        <li>
          <strong>Plan adherence</strong> — whether the trade taken matches the trade that was
          written down before it was taken, if one was written down at all.
        </li>
      </ul>
      <p>
        None of these five need a market forecast. All five need a record of what you actually
        did, which is the part most journals stop at and most &ldquo;AI coaches&rdquo; skip past on
        the way to a signal.
      </p>

      <h2>Why the baseline has to be your own history</h2>
      <p>
        &ldquo;Risk should be 1%&rdquo; is a platitude — it&apos;s true for nobody in particular and
        ignores that a scalper and a swing trader have entirely different risk profiles by design.
        &ldquo;Twice your median risk on a setup that&apos;s lost money four times running&rdquo; is a
        finding, because it&apos;s measured against a baseline that&apos;s actually yours. A coach that
        can&apos;t see your last hundred trades can only ever hand you generic advice dressed up as
        personal feedback.
      </p>

      <h2>What it still isn&apos;t</h2>
      <p>
        A review tool built this way still isn&apos;t an adviser, a signal feed, or a reason to skip
        thinking through a trade yourself. It doesn&apos;t know what happens next any better than you
        do — it just knows, precisely, what already happened, and it can say so without the hindsight
        bias that makes reviewing your own trades harder than it sounds.{" "}
        <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s AI Coach is built to that boundary on purpose: every
        number above is computed in code first, the model reads the finished figures, and it is
        never asked to guess where price goes next — because that isn&apos;t the job.
      </p>
    </BlogPost>
  );
}
