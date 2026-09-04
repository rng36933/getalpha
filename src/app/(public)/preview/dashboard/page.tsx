/* Dashboard redesign prototype preview: visual-only route, isolated from Clerk, Stripe, API routes and production data. */
import Link from "next/link";

const stats = [
  ["Closed trades", "860", "your evidence base"],
  ["Win rate", "50.1%", "past a coin flip"],
  ["Total P&L", "+€2,245.97", "over 860 trades"],
  ["Expectancy", "+€2.61", "per trade"],
];

const sessions = [
  ["Asia", "111 trades", "43.2%", "−€18.66", "negative"],
  ["London", "203 trades", "51.7%", "+€1,057.23", "positive"],
  ["London / NY overlap", "358 trades", "51.4%", "+€1,261.47", "positive"],
  ["New York", "137 trades", "51.1%", "+€230.17", "positive"],
  ["Off hours", "19 trades", "42.1%", "−€193.62", "negative"],
];

export default function DashboardPrototypePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 lg:px-10 lg:py-8">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent"><span className="decision-signal" /> Prototype preview · sample account</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Decision desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A calmer read on what matters now, what your record can prove, and what to review next.</p>
          </div>
          <Link href="/" className="hidden rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-foreground sm:inline-flex">Back to public site</Link>
        </div>

        <section className="decision-context mb-4 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent"><span className="decision-signal" /> Decision context</div>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Your record is useful. One process leak needs attention.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">590 logged trades without a defined stop. That is the clearest process signal in your record right now.</p>
              <button className="decision-action mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">Review the leak <span aria-hidden="true">→</span></button>
            </div>
            <div className="decision-evidence grid grid-cols-2 gap-px border-t border-line bg-line lg:border-l lg:border-t-0">
              <div className="bg-surface-raised p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Closed trades</p><p className="mt-3 font-mono text-3xl font-semibold tabular-nums">860</p><p className="mt-1 text-xs text-muted">your evidence base</p></div>
              <div className="bg-surface-raised p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Last sync</p><p className="mt-3 font-mono text-xl font-semibold text-positive">Live</p><p className="mt-1 text-xs text-muted">terminal connected</p></div>
            </div>
          </div>
        </section>

        <section className="mb-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, hint]) => <div className="bg-surface p-5" key={label}><p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p><p className={`mt-3 font-mono text-2xl font-semibold tabular-nums ${label === "Total P&L" || label === "Expectancy" ? "text-positive" : ""}`}>{value}</p><p className="mt-1 text-xs text-muted">{hint}</p></div>)}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.5fr)]">
          <section className="surface-lit overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Session performance</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Where your edge actually shows up.</h2></div><span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-muted">XAUUSD · 828 trades</span></div>
            <div className="mt-7 space-y-1">{sessions.map(([name, trades, winRate, pnl, tone]) => <div className="grid grid-cols-[minmax(100px,1fr)_90px_70px_minmax(90px,.8fr)] items-center gap-3 border-t border-line py-3 text-xs" key={name}><span className="font-medium">{name}</span><span className="font-mono text-muted">{trades}</span><span className="font-mono text-muted">{winRate}</span><div className="flex items-center justify-end gap-3"><span className={`h-1.5 w-20 rounded-full ${tone === "positive" ? "bg-positive/70" : "bg-negative/60"}`} /><span className={`w-20 text-right font-mono tabular-nums ${tone === "positive" ? "text-positive" : "text-negative"}`}>{pnl}</span></div></div>)}</div>
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent-soft p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Desk read</p><p className="mt-2 text-sm leading-6">London and the London / New York overlap generated most of this record’s edge. Off-hours are the first place to review before adding more size.</p></div>
          </section>

          <aside className="space-y-4">
            <section className="surface-lit rounded-2xl border border-line bg-surface p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Today’s context</p><h2 className="mt-2 text-xl font-semibold tracking-tight">USD releases are the variable to watch.</h2><p className="mt-3 text-sm leading-6 text-muted">High impact data may change the range before the next review window.</p><div className="mt-6 border-t border-line pt-4"><div className="flex items-center justify-between text-xs"><span>Next event</span><span className="font-mono text-accent">13:30 UTC</span></div><p className="mt-2 font-medium">Non-Farm Employment Change</p><p className="mt-1 text-xs text-muted">USD · high impact</p></div></section>
            <section className="surface-lit rounded-2xl border border-line bg-surface p-5 sm:p-7"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Needs review</p><span className="rounded-full bg-warning/15 px-2 py-1 font-mono text-[10px] text-warning">7 trades</span></div><h2 className="mt-3 text-xl font-semibold tracking-tight">Sizing after a loss.</h2><p className="mt-3 text-sm leading-6 text-muted">A review is more useful here than another performance tile.</p><button className="mt-6 text-sm font-semibold text-accent">Open journal →</button></section>
          </aside>
        </div>
      </div>
    </main>
  );
}
