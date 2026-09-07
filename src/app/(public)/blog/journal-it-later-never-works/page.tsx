import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Why \"I'll Journal It Later\" Never Works · getALPHA" },
  description:
    "The plan to journal at the end of the day or on the weekend feels harmless in the moment. What it actually loses, and why the delay is the whole problem.",
  alternates: { canonical: "/blog/journal-it-later-never-works" },
};

export default function Page() {
  return (
    <BlogPost title="Why &ldquo;I&apos;ll Journal It Later&rdquo; Never Works" date="2026-09-07">
      <p>
        The trade closes, the next setup is already forming, and writing it down can wait — you&apos;ll
        do it tonight, or at the weekend review. It feels like a scheduling decision, not a
        journaling decision. It isn&apos;t. The delay changes what gets recorded, not just when.
      </p>

      <h2>What gets lost isn&apos;t the numbers</h2>
      <p>
        Entry, exit and P&amp;L survive the delay fine — they&apos;re sitting in the broker&apos;s history
        whenever you get around to opening it. What doesn&apos;t survive is everything that made the
        decision worth reviewing in the first place: why the stop went where it did, what the plan
        was before the trade moved against it, whether the size felt normal or slightly larger than
        usual and you noticed at the time. None of that is in the trade history. All of it is gone
        by the time &ldquo;later&rdquo; arrives.
      </p>

      <h2>Memory doesn&apos;t fail randomly — it fails toward the story you&apos;d prefer</h2>
      <p>
        By the time you sit down to write about a trade you closed six hours ago, you already know
        how it ended, and that knowledge quietly rewrites the decision. A winning trade that was
        oversized gets remembered as confident. A losing trade where the stop was moved gets
        remembered as unlucky. This isn&apos;t dishonesty — it&apos;s how memory works under a known
        outcome. The only way around it is to record the decision before the outcome exists to bias
        it, which is exactly what &ldquo;later&rdquo; makes impossible.
      </p>

      <h2>&ldquo;At the end of the day&rdquo; has the same problem, just smaller</h2>
      <p>
        Delaying by a few hours instead of a few days feels like a reasonable compromise, but the
        mechanism is identical. After three or four trades, the details blur together — which one
        had the wider stop, which entry was the impulsive one, which loss you sat through calmly
        and which one you closed early out of nerves. A same-day summary written from memory reads
        smoothly and tells you almost nothing you couldn&apos;t already see in the P&amp;L column.
      </p>

      <h2>Why the backlog never gets worked through</h2>
      <p>
        The other failure mode is simpler: it just doesn&apos;t happen. A gap of one missed day turns
        into a habit of skipping the small trades and only logging the memorable ones — which
        means the journal ends up biased toward the outliers and blind to the routine mistakes that
        actually cost the most money over a year. A journal with three weeks of gaps in it isn&apos;t a
        partial record. It&apos;s a record of whichever trades happened to feel important enough to
        remember, which is the opposite of what a journal is supposed to measure.
      </p>

      <h2>What actually works instead</h2>
      <ul>
        <li>
          <strong>Record the plan before the trade, not after</strong> — size, stop and target
          written down at entry take seconds and can&apos;t be revised by hindsight.
        </li>
        <li>
          <strong>Log the exit the moment it happens</strong>, not at a scheduled review — the exit
          reason is the detail that decays fastest.
        </li>
        <li>
          <strong>Remove the manual step entirely where you can</strong> — the fields that
          consistently get skipped are the ones that require remembering to open a spreadsheet.
        </li>
      </ul>
      <p>
        This is the actual case for syncing a journal automatically rather than filling one in by
        hand.{" "}
        <Link href="/features/trading-journal">getALPHA</Link> pulls closed trades straight from
        MT5 as they close, so the size, entry, exit and P&amp;L are already logged before &ldquo;later&rdquo;
        would have arrived — the only thing left for you to add is the part no script can see: why
        you took the trade in the first place.
      </p>
    </BlogPost>
  );
}
