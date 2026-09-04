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
    <>
      <style>{`
        .preview-shell { min-height: 100vh; background: #0a0b0f; color: #e9ebf0; font-family: Arial, sans-serif; padding: 24px 16px 72px; }
        .preview-inner { width: 100%; max-width: 1440px; margin: 0 auto; }
        .preview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
        .preview-eyebrow { color: #f2c94c; font: 10px/1.4 monospace; letter-spacing: .16em; text-transform: uppercase; }
        .preview-shell h1, .preview-shell h2, .preview-shell p { margin-top: 0; }
        .preview-shell h1 { font-size: clamp(30px, 4vw, 48px); line-height: 1.05; letter-spacing: -.04em; margin-bottom: 10px; }
        .preview-shell h2 { font-size: clamp(20px, 2.4vw, 30px); line-height: 1.15; letter-spacing: -.03em; margin-bottom: 14px; }
        .preview-shell p { color: #8a90a0; font-size: 14px; line-height: 1.65; }
        .preview-context { border: 1px solid #252935; border-radius: 18px; overflow: hidden; background: #13151c; margin-bottom: 16px; box-shadow: 0 20px 60px -32px rgba(0,0,0,.8); }
        .preview-context-grid { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(260px,.65fr); }
        .preview-copy { padding: 32px; }
        .preview-evidence { display: grid; grid-template-columns: repeat(2,1fr); gap: 1px; background: #252935; border-left: 1px solid #252935; }
        .preview-evidence > div { background: #191c25; padding: 28px; }
        .preview-evidence p, .preview-stats p { margin-bottom: 0; }
        .preview-stat-value { margin-top: 12px; color: #e9ebf0; font: 600 26px/1 monospace; }
        .preview-stat-value.positive { color: #10b981; }
        .preview-button { display: inline-flex; align-items: center; gap: 8px; margin-top: 22px; border: 0; border-radius: 8px; background: #f2c94c; color: #0a0b0f; padding: 12px 16px; font-weight: 700; cursor: pointer; }
        .preview-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; border: 1px solid #252935; border-radius: 16px; overflow: hidden; background: #252935; margin-bottom: 16px; }
        .preview-stats > div { background: #13151c; padding: 20px; }
        .preview-layout { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(300px,.5fr); gap: 16px; }
        .preview-panel { border: 1px solid #252935; border-radius: 16px; background: #13151c; padding: 28px; box-shadow: 0 16px 40px -30px rgba(0,0,0,.9); }
        .preview-table { margin-top: 28px; }
        .preview-row { display: grid; grid-template-columns: minmax(120px,1fr) 100px 70px minmax(120px,.8fr); gap: 12px; align-items: center; border-top: 1px solid #252935; padding: 13px 0; font: 12px/1.4 monospace; }
        .preview-row > span:nth-child(2), .preview-row > span:nth-child(3) { color: #8a90a0; }
        .preview-bar { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
        .preview-pill { display: inline-flex; border: 1px solid #252935; border-radius: 999px; padding: 6px 10px; color: #8a90a0; font: 10px monospace; }
        .preview-note { margin-top: 22px; border: 1px solid rgba(242,201,76,.35); border-radius: 12px; background: rgba(242,201,76,.1); padding: 16px; }
        .preview-note p { color: #e9ebf0; margin-bottom: 0; }
        .preview-stack { display: grid; gap: 16px; }
        .preview-action { color: #f2c94c; font-weight: 700; background: none; border: 0; padding: 0; cursor: pointer; }
        .preview-muted { color: #8a90a0; font-size: 12px; }
        @media (max-width: 900px) { .preview-context-grid, .preview-layout { grid-template-columns: 1fr; } .preview-evidence { border-left: 0; border-top: 1px solid #252935; } }
        @media (max-width: 640px) { .preview-shell { padding: 18px 12px 48px; } .preview-header { display: block; } .preview-header a { display: inline-flex; margin-top: 12px; } .preview-copy, .preview-panel, .preview-evidence > div { padding: 20px; } .preview-stats { grid-template-columns: repeat(2,1fr); } .preview-row { grid-template-columns: minmax(90px,1fr) 76px 56px; } .preview-row .preview-bar { grid-column: 1 / -1; justify-content: space-between; } }
      `}</style>
      <main className="preview-shell">
      <div className="preview-inner">
        <div className="preview-header">
          <div>
            <div className="preview-eyebrow mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent"><span className="decision-signal" /> Prototype preview · sample account</div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Decision desk</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A calmer read on what matters now, what your record can prove, and what to review next.</p>
          </div>
          <Link href="/" className="hidden rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-foreground sm:inline-flex">Back to public site</Link>
        </div>

        <section className="preview-context decision-context mb-4 overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="preview-context-grid grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
            <div className="preview-copy p-5 sm:p-7">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent"><span className="decision-signal" /> Decision context</div>
              <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Your record is useful. One process leak needs attention.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">590 logged trades without a defined stop. That is the clearest process signal in your record right now.</p>
              <button className="decision-action mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">Review the leak <span aria-hidden="true">→</span></button>
            </div>
            <div className="preview-evidence decision-evidence grid grid-cols-2 gap-px border-t border-line bg-line lg:border-l lg:border-t-0">
              <div className="bg-surface-raised p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Closed trades</p><p className="mt-3 font-mono text-3xl font-semibold tabular-nums">860</p><p className="mt-1 text-xs text-muted">your evidence base</p></div>
              <div className="bg-surface-raised p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Last sync</p><p className="mt-3 font-mono text-xl font-semibold text-positive">Live</p><p className="mt-1 text-xs text-muted">terminal connected</p></div>
            </div>
          </div>
        </section>

        <section className="preview-stats mb-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, hint]) => <div className="bg-surface p-5" key={label}><p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p><p className={`mt-3 font-mono text-2xl font-semibold tabular-nums ${label === "Total P&L" || label === "Expectancy" ? "text-positive" : ""}`}>{value}</p><p className="mt-1 text-xs text-muted">{hint}</p></div>)}
        </section>

        <div className="preview-layout grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.5fr)]">
          <section className="preview-panel surface-lit overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-7">
            <div className="flex items-start justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Session performance</p><h2 className="mt-2 text-xl font-semibold tracking-tight">Where your edge actually shows up.</h2></div><span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] text-muted">XAUUSD · 828 trades</span></div>
            <div className="preview-table mt-7 space-y-1">{sessions.map(([name, trades, winRate, pnl, tone]) => <div className="grid grid-cols-[minmax(100px,1fr)_90px_70px_minmax(90px,.8fr)] items-center gap-3 border-t border-line py-3 text-xs" key={name}><span className="font-medium">{name}</span><span className="font-mono text-muted">{trades}</span><span className="font-mono text-muted">{winRate}</span><div className="flex items-center justify-end gap-3"><span className={`h-1.5 w-20 rounded-full ${tone === "positive" ? "bg-positive/70" : "bg-negative/60"}`} /><span className={`w-20 text-right font-mono tabular-nums ${tone === "positive" ? "text-positive" : "text-negative"}`}>{pnl}</span></div></div>)}</div>
            <div className="mt-6 rounded-xl border border-accent/30 bg-accent-soft p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-accent">Desk read</p><p className="mt-2 text-sm leading-6">London and the London / New York overlap generated most of this record’s edge. Off-hours are the first place to review before adding more size.</p></div>
          </section>

          <aside className="preview-stack space-y-4">
            <section className="preview-panel surface-lit rounded-2xl border border-line bg-surface p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Today’s context</p><h2 className="mt-2 text-xl font-semibold tracking-tight">USD releases are the variable to watch.</h2><p className="mt-3 text-sm leading-6 text-muted">High impact data may change the range before the next review window.</p><div className="mt-6 border-t border-line pt-4"><div className="flex items-center justify-between text-xs"><span>Next event</span><span className="font-mono text-accent">13:30 UTC</span></div><p className="mt-2 font-medium">Non-Farm Employment Change</p><p className="mt-1 text-xs text-muted">USD · high impact</p></div></section>
            <section className="preview-panel surface-lit rounded-2xl border border-line bg-surface p-5 sm:p-7"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-wider text-muted">Needs review</p><span className="rounded-full bg-warning/15 px-2 py-1 font-mono text-[10px] text-warning">7 trades</span></div><h2 className="mt-3 text-xl font-semibold tracking-tight">Sizing after a loss.</h2><p className="mt-3 text-sm leading-6 text-muted">A review is more useful here than another performance tile.</p><button className="mt-6 text-sm font-semibold text-accent">Open journal →</button></section>
          </aside>
        </div>
      </div>
    </main>
    </>
  );
}
