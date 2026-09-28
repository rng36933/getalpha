import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Maximum Favorable Excursion: What Your Winners Do Before You Exit Them · getALPHA",
  },
  description:
    "A trade that peaks at +3R and closes at +0.8R looks identical to one that only ever reached +0.8R — unless you're logging MFE. What it actually reveals about your exits.",
  alternates: { canonical: "/blog/max-favorable-excursion" },
};

export default function Page() {
  return (
    <BlogPost
      title="Maximum Favorable Excursion: What Your Winners Do Before You Exit Them"
      date="2026-09-24"
    >
      <p>
        A closed trade shows one exit price. It does not show how far the trade could have gone
        before that exit was taken. A position that peaked at +3R and was closed at +0.8R reads
        exactly the same in a P&amp;L column as one that only ever reached +0.8R and was closed
        right at the top — same result, same win, two completely different trades underneath it.
      </p>

      <h2>What MFE actually is</h2>
      <p>
        <strong>Maximum favorable excursion (MFE)</strong> is the best unrealized gain a trade
        reaches while it&apos;s open, measured from entry to whichever point the price moved
        furthest in the position&apos;s favor before it closed. It has nothing to do with where the
        trade actually exited. Expressed in R so it&apos;s comparable across trades with different
        stop distances:
      </p>
      <p>
        <em>MFE (R) = best unrealized gain during the trade ÷ initial risk (entry − stop)</em>
      </p>
      <p>
        Compare MFE to the R the trade actually closed at and you get a single number for how much
        of the available move was captured — <strong>exit efficiency</strong>. A trade with an MFE
        of 3R that closed at 0.8R captured 27% of what was on the table. A trade with an MFE of 1R
        that closed at 0.9R captured 90%. Win rate treats both as a win. Only one of them is a
        strategy that&apos;s converting its setups into their actual value.
      </p>

      <h2>What a low exit-efficiency number is actually telling you</h2>
      <p>
        A single trade that gives back most of its peak doesn&apos;t mean anything — it&apos;s one
        outcome. A pattern across dozens of trades is a different story, and it usually points to
        one of a small number of specific habits, each with a different fix:
      </p>
      <ul>
        <li>
          <strong>Target set too close to entry.</strong> If MFE consistently runs 2–3x past where
          trades are closing, and it&apos;s happening on the same setup every time, the take-profit
          isn&apos;t wrong by accident — it&apos;s wrong by design, and the fix is in the plan, not
          in the exit.
        </li>
        <li>
          <strong>Exiting on fear, not on a rule.</strong> If MFE runs high on winners but the exit
          point is inconsistent — sometimes near the peak, sometimes far from it, with no pattern
          tied to price structure — that&apos;s a discretionary flinch, not a target. It shows up as
          high variance in exit efficiency across trades that otherwise look similar.
        </li>
        <li>
          <strong>A trailing stop that&apos;s too tight for the instrument&apos;s noise.</strong>{" "}
          If the giveback is small and consistent — trades peak, pull back by roughly the same
          amount, and get stopped out on the retracement rather than the reversal — the trail is
          reacting to normal volatility, not to the trade actually turning.
        </li>
      </ul>

      <h2>Why chasing 100% exit efficiency is the wrong goal</h2>
      <p>
        It&apos;s tempting to read a low efficiency number as a problem to fix outright, but the
        trade that closes exactly at its peak is the exception, not something a good exit rule
        should be aiming to reproduce. Nobody exits at the top consistently, and a rule built to
        try will overfit to the last few trades that happened to peak late. The useful comparison
        isn&apos;t &ldquo;how close to the peak did I get,&rdquo; it&apos;s whether the average exit
        efficiency on a setup is stable and whether it&apos;s worth the trade-off against the
        alternative: exiting earlier and more consistently captures less of the outlier winners but
        avoids giving back the ones that reverse hard, and which side of that trade-off is better
        depends on the setup, not on a universal rule.
      </p>

      <h2>MFE without MAE only tells half the story</h2>
      <p>
        MFE shows what the reward side of a trade was capable of. It says nothing about the risk
        the trade carried to get there —{" "}
        <Link href="/blog/max-adverse-excursion">maximum adverse excursion</Link> is the other
        half, and the two need to be read together. A setup with a high MFE that also carries a
        deep MAE isn&apos;t a great setup with a mediocre exit, it&apos;s a volatile setup that
        happens to work out often enough to look good on the reward side alone. Reviewing MFE in
        isolation can talk you into loosening a target on a trade that was never as low-risk as the
        upside made it look.
      </p>

      <h2>Why this is hard to track by hand</h2>
      <p>
        Like MAE, getting MFE requires the price path during the trade, not just the entry and exit
        — a number a broker statement or a manually kept spreadsheet simply doesn&apos;t contain.
        Finding the peak unrealized gain means pulling bar data for the exact window a position was
        open and locating the extreme within it, trade by trade, which stops being practical
        somewhere around the tenth trade in a week.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> computes MFE and MAE automatically
        from your MT5 history against the market data for each trade&apos;s actual open window, so
        exit efficiency shows up as a number next to every trade instead of a guess you make from
        memory.
      </p>
    </BlogPost>
  );
}
