import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Take-Profit Creep: When Moving Your Target Is Optimization and When It's Fear · getALPHA",
  },
  description:
    "Moving a take-profit mid-trade is sometimes a legitimate read on new information, and sometimes just fear of giving back an unrealized gain wearing a better excuse. How to tell the two apart from your own log.",
  alternates: { canonical: "/blog/take-profit-creep" },
};

export default function Page() {
  return (
    <BlogPost
      title="Take-Profit Creep: When Moving Your Target Is Optimization and When It's Fear"
      date="2026-10-09"
    >
      <p>
        A take-profit set before entry is a decision made with a clear head about what the trade
        is worth. A take-profit edited twenty minutes into the trade, while the position is green
        and ticking around, is a decision made under the influence of an unrealized gain that
        suddenly feels like it could disappear. Both edits look the same in the trade history —
        a target, moved. Only one of them is actually an improvement.
      </p>

      <h2>The two reasons a target gets moved</h2>
      <p>
        There are exactly two legitimate categories of reason to change a take-profit after entry,
        and one illegitimate one that dresses itself up as the first:
      </p>
      <ul>
        <li>
          <strong>New information about the trade itself</strong> — a key level broke that the
          original target was measured against, volatility expanded or contracted enough to
          change what a realistic move looks like, or the setup that justified the trade has
          itself changed shape.
        </li>
        <li>
          <strong>A pre-defined rule for scaling out</strong> — a plan decided before entry that
          says, for example, take half off at 1R and trail the rest. This isn&apos;t creep because
          the adjustment was the plan, not a reaction to the position turning green.
        </li>
        <li>
          <strong>Fear of giving back the gain</strong> — the price moved favorably, the trade now
          shows profit on screen, and pulling the target closer feels like &ldquo;locking it in.&rdquo;
          Nothing about the setup changed. What changed is that there is now something to lose.
        </li>
      </ul>
      <p>
        The first two show up in a journal as a documented reason tied to market structure or a
        rule written down beforehand. The third shows up as a target that moved closer right after
        the trade went green, with no note explaining why — because there isn&apos;t one beyond the
        gain itself.
      </p>

      <h2>Why this is easy to miss in your own trading</h2>
      <p>
        Pulling a target in after a trade turns favorable doesn&apos;t feel like fear while it&apos;s
        happening. It feels like prudence — &ldquo;why risk this coming back to break-even when I
        can bank it now.&rdquo; That framing is exactly what makes it hard to catch: the decision is
        wearing the vocabulary of risk management while doing the opposite of what the original
        plan called for. The tell is not the language used to justify it. The tell is the timing —
        whether the edit happened because something about the trade changed, or because the P&amp;L
        column changed.
      </p>
      <p>
        The asymmetry is what makes it costly. A trader who moves targets closer whenever a trade
        goes green but leaves stops untouched when a trade goes red has quietly built a strategy
        with capped upside and uncapped downside — the exact opposite of the reward-to-risk ratio
        the original plan was sized around, without ever deciding to change the plan.
      </p>

      <h2>What to log to tell the two apart</h2>
      <p>
        Three fields, checked against each other, do most of the work:
      </p>
      <ul>
        <li>
          <strong>Original target, recorded at entry</strong> — not reconstructed afterward from
          memory. If it isn&apos;t written down before the trade is open, there is nothing to
          compare the final exit against.
        </li>
        <li>
          <strong>Every edit to the target, with a timestamp</strong> — how long after entry the
          change happened, and how far into profit the trade was at that moment.
        </li>
        <li>
          <strong>A one-line reason for the edit</strong> — written at the time of the edit, not
          after the trade closes. &ldquo;Resistance held earlier than expected&rdquo; is a reason.
          &ldquo;Didn&apos;t want to lose the gain&rdquo; is also a reason, and worth writing down
          honestly, because it&apos;s the pattern you&apos;re trying to measure.
        </li>
      </ul>
      <p>
        Once a few dozen edited trades are logged this way, the pattern is usually obvious without
        needing a formal test: edits clustered in the first few minutes after a trade turns green,
        with no structural reason attached, are fear. Edits tied to a specific level breaking or a
        volatility shift, however many minutes in, are a read on the trade.
      </p>

      <h2>The fix isn&apos;t &ldquo;never move a target&rdquo;</h2>
      <p>
        Rigidly refusing to ever adjust a take-profit throws out real information along with the
        fear-driven edits — markets genuinely do give you new reasons to exit earlier or let a
        trade run further than planned. The fix is making the edit answerable to the same standard
        the original target was: a reason tied to the market, written down before the edit is
        made, not a reaction to a number on screen that happened to go up. A plan that allows
        pre-defined scale-outs handles most of the legitimate cases without leaving room for the
        rest.
      </p>
      <p>
        This is the same distinction{" "}
        <Link href="/features/ai-trade-coach">getALPHA</Link>&apos;s process review looks for
        elsewhere in a trade — sizing, stop placement, exit timing — applied to targets
        specifically: whether a take-profit edit lines up with a change in the trade&apos;s own
        numbers, or just with the moment it started showing profit.
      </p>
    </BlogPost>
  );
}
