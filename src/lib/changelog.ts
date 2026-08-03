/**
 * What shipped, in plain language, newest first.
 *
 * Public and unauthenticated on purpose — a changelog only a customer can see
 * is a changelog nobody browsing before signing up ever benefits from. Written
 * for a trader, not a commit log: what changed and why it matters, not which
 * file it touched.
 */

export type ChangelogEntry = {
  date: string;
  title: string;
  body?: string;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-03",
    title: "News headlines are now clickable",
    body: "Each headline in the per-pair news feed links out to the original article instead of sitting there as plain text.",
  },
  {
    date: "2026-08-02",
    title: "Fixed the MetaTrader add-on reading the wrong stop-loss",
    body: "Every synced trade showed \"no stop\" in the journal, even when a real stop-loss was set on the position. Re-download the add-on from Settings and reattach it to pick up the fix — trades synced before this will keep showing \"no stop\" until they're resynced, but everything closing from now on will read correctly.",
  },
  {
    date: "2026-08-02",
    title: "Cards can now be dragged into any order",
    body: "Grab the handle in a card's top-right corner and drop it wherever you want — on the Dashboard, Settings and Pairs. Saved to your account, so the layout is the same next time you sign in.",
  },
  {
    date: "2026-08-02",
    title: "Fixed the dashboard showing different totals than the Journal",
    body: "On accounts with more than 200 trades, the dashboard's Performance card was quietly summarising only the newest 200 — closed count, total P&L and win rate could disagree with the Journal, which always read everything. Both pages now describe the same account.",
  },
  {
    date: "2026-08-02",
    title: "Simplified the results breakdown on the dashboard",
    body: "The nine-column P&L histogram is now a simple win/loss chart, and the Pairs page dropped a few secondary tables in favour of the numbers that actually get read.",
  },
  {
    date: "2026-08-02",
    title: "Fixed the per-pair economic calendar",
    body: "It was silently empty for every instrument, not just gold. Real pairs (EURUSD, GBPJPY, and so on) now show their calendar correctly.",
  },
  {
    date: "2026-08-02",
    title: "Journal now pages 10 trades at a time",
    body: "Down from 25, so the trade log stays readable without a long scroll before the page controls come into view.",
  },
];
