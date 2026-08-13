import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "Automatic MT5 Journaling: What Gets Recorded and How · getALPHA" },
  description:
    "What actually happens when a trading journal syncs itself from MetaTrader 5 — where the numbers come from, what a script can and can't see, and why the stop-loss field is the one that usually breaks first.",
  alternates: { canonical: "/blog/automatic-mt5-journaling" },
};

export default function Page() {
  return (
    <BlogPost title="Automatic MT5 Journaling: What Gets Recorded and How" date="2026-08-09">
      <p>
        &ldquo;Automatic journaling&rdquo; sounds like it should be simple: read the trade history,
        write it to a table. In practice MT5&apos;s history is not a list of trades — it is a list of
        deals, and a trade only exists once two of them are paired up correctly. Most of what makes
        automatic sync worth trusting, or not, happens in that pairing step.
      </p>

      <h2>A trade is two deals wearing one position ID</h2>
      <p>
        MetaTrader doesn&apos;t store &ldquo;trades.&rdquo; It stores <strong>deals</strong> — one for
        opening a position, one for closing it — and both carry the same position ID. A script that
        wants a single record per trade has to walk the deal history, find the entry deal and the
        exit deal that share an ID, and merge them into one row: entry price and time from the
        opening deal, exit price and P&amp;L from the closing one.
      </p>
      <p>
        Get that pairing wrong and the failure is quiet. A half-matched trade doesn&apos;t crash
        anything — it just shows up with no entry price, or gets silently dropped, and the journal
        looks fine until someone notices a trade from last Tuesday never made it in.
      </p>

      <h2>Where the stop-loss actually comes from</h2>
      <p>
        This is the field most automatic journals get wrong, because the obvious place to read it —
        the closed position itself — doesn&apos;t have it anymore. The stop and take-profit that were
        set live on the <strong>order</strong> that opened the position, not on the deal. Reading the
        wrong ticket space for that order is an easy mistake: an order ticket and a position ticket
        look like the same kind of number, but on most brokers passing the position ticket where an
        order ticket belongs silently returns nothing, and every synced trade comes back reporting
        &ldquo;no stop&rdquo; — even for trades that had one.
      </p>
      <p>
        There&apos;s a real limit here too, not just a bug to fix: a stop moved later by dragging the
        line on the chart, rather than through a new order, doesn&apos;t always leave a history record
        on every broker. What an automatic sync can honestly report is the stop the trade was{" "}
        <em>opened</em> with — which, for judging the decision rather than the management, is
        usually the more honest number anyway.
      </p>

      <h2>What a script gets right that manual entry doesn&apos;t</h2>
      <ul>
        <li>
          <strong>It never rounds.</strong> Entry, exit, volume and P&amp;L come from the broker&apos;s
          own record, not from someone reconstructing them from memory at the end of the day.
        </li>
        <li>
          <strong>Open positions update on their own.</strong> If a stop gets moved while a trade is
          still running, the next sync just re-sends the current position state — there&apos;s nothing
          to remember to go back and edit.
        </li>
        <li>
          <strong>The order comment survives.</strong> Anything typed into an order&apos;s comment field
          at entry — a setup name, a shorthand for the reason — rides along as the closest thing MT5
          has to a stated reason for the trade. Empty for anything opened by hand, which is worth
          keeping as a fact rather than filling in after the fact.
        </li>
      </ul>

      <h2>Why re-sending the same trade twice has to be safe</h2>
      <p>
        A sync that runs on a timer, rather than on a trade-closed event, will always overlap with
        itself a little — a trade that closes in the same second as the last sync&apos;s cutoff needs
        to be picked up again on the next pass, or it falls through the gap entirely. The fix is
        cheap on one side only: the client re-sends a small overlap window every cycle, and the
        server has to treat a resend as an update to the same row, keyed on the position ticket, not
        as a new trade. Get the second half wrong and a quiet market produces a journal with
        duplicate entries instead of missing ones.
      </p>

      <h2>The part worth checking yourself</h2>
      <p>
        Anything that reads a trading terminal and talks to a server is worth being skeptical of by
        default, and the honest answer to &ldquo;can I trust this&rdquo; isn&apos;t &ldquo;trust
        us&rdquo; — it&apos;s being able to read the thing yourself.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s MT5{" "}
        <Link href="/getALPHA-Sync.mq5">sync script</Link> ships as plain, commented source, not a
        compiled file: it sends open positions and closed trades outward on a timer, and that is the
        entire list of things it does. It never receives instructions back, never places an order,
        never modifies one — there is no code path in it that could.
      </p>
    </BlogPost>
  );
}
