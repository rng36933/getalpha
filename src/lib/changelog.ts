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
    date: "2026-08-31",
    title: "MetaTrader 4, cTrader and TradingView can now sync your journal too",
    body: "Not just MT5 anymore. Settings has a card for each: MT4 works the same one-EA way MT5 always has, cTrader syncs from a cBot, and TradingView logs your strategy's own entry and exit alerts straight into the journal — no broker connection needed for that last one. Same rule everywhere: it only sends what you traded, never places or changes an order.",
  },
  {
    date: "2026-08-26",
    title: "Open Positions no longer reads a profit-locking stop as \"no stop\"",
    body: "Moving a stop past entry to lock in a gain isn't the same as having no stop at all, but the card couldn't tell the two apart and warned about both the same way. A stop on the profit side of entry now shows as \"profit locked\" instead.",
  },
  {
    date: "2026-08-20",
    title: "Fixed \"no stop\" for trades where the stop was set after opening",
    body: "If you open with Quick Buy/Quick Sell and add the stop-loss afterward by editing the open position, the journal was reading the position's original order — which never had one — instead of the stop you actually set. It now follows the position's own history and picks up a stop or target added or moved at any point before the trade closed, which also fixes Planned RR and the Exit column showing blank for these trades. Re-download the add-on from Settings and reattach it; trades that already closed keep their old reading until resynced.",
  },
  {
    date: "2026-08-20",
    title: "Removed the empty Setup column from the Journal",
    body: "It only ever showed something if a bot tagged the trade on entry — for manually opened trades it was always blank, so it's gone.",
  },
  {
    date: "2026-08-13",
    title: "News Alerts: a heads-up before each high-impact USD release",
    body: "A separate opt-in from the morning brief, in Settings. About 30 minutes before each high or medium-impact USD release, an email names what's due and how XAUUSD tends to react around it — never what to do about it.",
  },
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
