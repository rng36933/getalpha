import type { Metadata } from "next";
import Link from "next/link";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = {
  title: { absolute: "AI Trading Coach — A Written Review of Your Process · getALPHA" },
  description:
    "Four dimensions of your trading process, judged against your own history — not a signal telling you what to buy next.",
  alternates: { canonical: "/features/ai-trade-coach" },
};

export default function Page() {
  return (
    <FeaturePage
      title="AI Trading Coach"
      tagline="A written review of your process, judged against your own history."
    >
      <p>
        Most trading feedback is either a platitude (&ldquo;risk should be 1%&rdquo;) or a
        prediction (&ldquo;this pair looks bullish&rdquo;). getALPHA&apos;s AI coach does neither.
        It reads your closed trade — size, stop, exit, and whatever notes you left about the setup
        — and writes a finding: something specific about how <em>you</em> traded, compared against
        the pattern in your own history rather than a generic rule.
      </p>

      <h2>Four dimensions, judged on evidence</h2>
      <p>
        Every review scores position sizing, stop placement, exit discipline and plan adherence —
        each one marked as strong, weak, or not assessable when there isn&apos;t enough evidence to
        say. &ldquo;Twice your median risk&rdquo; is a finding, because it comes from a number.
        &ldquo;Risk should be 1%&rdquo; is a platitude, because it doesn&apos;t know anything about
        the trade it&apos;s attached to.
      </p>

      <h2>Facts about you, never predictions about the market</h2>
      <p>
        There is no signal feed here, and there won&apos;t be one — personalised trading advice for
        a fee can be regulated activity, and it contradicts what the coach is actually for. The
        review is entirely retrospective: what did you do, and what does your own record say about
        whether it&apos;s working. Nothing in it tells you what to take next.
      </p>

      <h2>Why the notes matter</h2>
      <p>
        MT5 can&apos;t tell the coach why you took a trade — that context only exists if you write
        it down. A review built only on price, size and stop is arithmetic you could do yourself.
        The trades worth reviewing are the ones with a sentence of context attached, which is why{" "}
        <Link href="/features/trading-journal">the journal</Link> prompts for it before the habit
        of skipping it sets in.
      </p>

      <h2>Part of the Pro plan</h2>
      <p>
        The coach review and the session brief are the two paid modules — the only parts of
        getALPHA that cost money to run. The journal itself, P&amp;L, and the calendar are free.
      </p>
    </FeaturePage>
  );
}
