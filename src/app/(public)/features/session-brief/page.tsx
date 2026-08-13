import type { Metadata } from "next";
import FeaturePage from "@/components/FeaturePage";

export const metadata: Metadata = {
  title: { absolute: "AI Session Brief — The Session, Before It Starts · getALPHA" },
  description:
    "Session tone, the one economic driver that matters today, and where volatility is likely — each claim sourced to a calendar entry, for your own watchlist.",
  alternates: { canonical: "/features/session-brief" },
};

export default function Page() {
  return (
    <FeaturePage
      title="AI Session Brief"
      tagline="The session, before it starts — sourced to the calendar, not a guess."
    >
      <p>
        Most pre-market reading is either a wall of headlines with no read on which one actually
        moves your pairs, or a confident-sounding paragraph with nothing behind it. The session
        brief is built to be neither: a short written summary of what&apos;s scheduled today, for
        the instruments on your own watchlist, with every claim traceable to an actual calendar
        entry rather than a vibe.
      </p>

      <h2>What it covers</h2>
      <ul>
        <li>
          <strong>Session tone</strong> — a plain read on whether today looks calm or event-driven,
          before you&apos;ve looked at a single chart.
        </li>
        <li>
          <strong>The one driver that matters</strong> — out of everything on the calendar, the
          single release most likely to move the pairs you actually hold.
        </li>
        <li>
          <strong>Where volatility is likely</strong> — timed to the release, not a generic
          &ldquo;markets may be volatile today&rdquo; disclaimer.
        </li>
      </ul>

      <h2>Scoped to your watchlist, not a shared page</h2>
      <p>
        Free accounts get the brief for XAUUSD. Pro accounts get it for their own watchlist, capped
        at eight instruments — so the brief a EUR/USD trader reads is actually about EUR/USD,
        not a generic desk-wide summary with their pair buried in it.
      </p>

      <h2>What it isn&apos;t</h2>
      <p>
        It isn&apos;t a trade recommendation, and it doesn&apos;t tell you to buy or sell anything.
        It states what&apos;s scheduled and what has historically moved on releases like it — facts
        you can act on however you already trade, not a call being made for you.
      </p>

      <h2>Part of the Pro plan</h2>
      <p>
        The session brief and the AI trading coach are the two paid modules — the only parts of
        getALPHA that cost money to run. The journal itself, P&amp;L, and the calendar are free.
      </p>
    </FeaturePage>
  );
}
