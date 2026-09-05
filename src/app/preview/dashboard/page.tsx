/* Professional Dashboard rework preview: visual-only route, isolated from Clerk, Stripe, API routes and production data. */
const nav = [
  ["01", "Decision desk", true],
  ["02", "Journal", false],
  ["03", "Macro desk", false],
  ["04", "Pairs", false],
  ["05", "Calendar", false],
];

const stats = [
  ["Net result", "+€2,245.97", "↑ 8.4% vs prior period", "positive"],
  ["Process score", "72 / 100", "7 trades need review", "accent"],
  ["Win rate", "50.1%", "860 closed trades", "neutral"],
];

const sessionRows = [
  ["Asia", "111", "43.2%", "−€18.66", "negative"],
  ["London", "203", "51.7%", "+€1,057.23", "positive"],
  ["London / NY", "358", "51.4%", "+€1,261.47", "positive"],
  ["New York", "137", "51.1%", "+€230.17", "positive"],
  ["Off hours", "19", "42.1%", "−€193.62", "negative"],
];


export default function DashboardPrototypePage() {
  return (
    <>
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .rework-page { min-height: 100vh; background: #0b0d0f; color: #eef0ed; font-family: Arial, sans-serif; }
        .rework-shell { display: grid; grid-template-columns: 224px minmax(0,1fr); min-height: 100vh; }
        .rework-rail { border-right: 1px solid #252b2b; background: #101313; padding: 24px 16px; display: flex; flex-direction: column; }
        .rework-brand { display: flex; align-items: center; gap: 10px; color: #eef0ed; font-size: 16px; font-weight: 700; letter-spacing: -.03em; padding: 0 10px; }
        .rework-mark { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px 8px 8px 2px; background: #e6bf3f; color: #101313; font: 700 14px Arial; }
        .rework-rail-label { margin: 46px 10px 12px; color: #667071; font: 10px monospace; letter-spacing: .16em; text-transform: uppercase; }
        .rework-nav { display: grid; gap: 4px; }
        .rework-nav-item { display: flex; align-items: center; gap: 11px; border-radius: 8px; padding: 11px 10px; color: #899191; font-size: 12px; text-decoration: none; }
        .rework-nav-item:hover, .rework-nav-item.active { background: #1b2121; color: #eef0ed; }
        .rework-nav-item.active { box-shadow: inset 2px 0 #e6bf3f; }
        .rework-nav-no { width: 20px; color: #536060; font: 10px monospace; }
        .rework-nav-item.active .rework-nav-no { color: #e6bf3f; }
        .rework-rail-bottom { margin-top: auto; border-top: 1px solid #252b2b; padding: 16px 10px 0; }
        .rework-status { display: flex; align-items: center; gap: 8px; color: #899191; font: 10px monospace; text-transform: uppercase; letter-spacing: .12em; }
        .rework-dot { width: 7px; height: 7px; border-radius: 50%; background: #6dd4a0; box-shadow: 0 0 0 4px rgba(109,212,160,.12); }
        .rework-account { margin-top: 16px; color: #eef0ed; font-size: 12px; }
        .rework-account span { display: block; margin-top: 4px; color: #667071; font: 10px monospace; }
        .rework-main { min-width: 0; }
        .rework-topbar { display: none; }
        .rework-content { width: 100%; max-width: 1440px; margin: 0 auto; padding: 42px clamp(20px,4vw,64px) 72px; }
        .rework-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
        .rework-kicker { color: #e6bf3f; font: 10px/1.4 monospace; letter-spacing: .18em; text-transform: uppercase; }
        .rework-h1 { margin: 10px 0 0; font-size: clamp(30px,4vw,52px); line-height: 1; letter-spacing: -.055em; font-weight: 700; }
        .rework-subtitle { max-width: 480px; margin: 12px 0 0; color: #899191; font-size: 14px; line-height: 1.6; }
        .rework-date { color: #667071; font: 10px monospace; letter-spacing: .1em; text-transform: uppercase; text-align: right; }
        .decision-surface { position: relative; display: grid; grid-template-columns: minmax(0,1fr) 260px; overflow: hidden; border: 1px solid #303737; border-radius: 14px; background: #161b1b; margin-bottom: 16px; }
        .decision-main { position: relative; min-height: 300px; overflow: hidden; padding: clamp(24px,4vw,44px); }
        .decision-main:before { content: ""; position: absolute; width: 430px; height: 430px; left: -160px; bottom: -280px; border-radius: 50%; background: rgba(230,191,63,.12); filter: blur(12px); pointer-events: none; }
        .decision-main > * { position: relative; }
        .decision-eyebrow { display: flex; align-items: center; gap: 9px; color: #6dd4a0; font: 10px monospace; letter-spacing: .14em; text-transform: uppercase; }
        .decision-eyebrow .rework-dot { background: #6dd4a0; }
        .decision-title { max-width: 720px; margin: 26px 0 12px; font-size: clamp(28px,4vw,54px); line-height: .99; letter-spacing: -.06em; font-weight: 700; }
        .decision-copy { max-width: 590px; margin: 0; color: #9aa3a2; font-size: 14px; line-height: 1.65; }
        .decision-footer { display: flex; align-items: center; gap: 20px; margin-top: 30px; }
        .primary-action { display: inline-flex; align-items: center; gap: 18px; border: 0; border-radius: 7px; background: #e6bf3f; color: #101313; padding: 12px 15px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .primary-action span { font-size: 17px; line-height: 1; }
        .secondary-note { color: #667071; font: 10px monospace; text-transform: uppercase; letter-spacing: .08em; }
        .decision-side { display: grid; grid-template-rows: repeat(2,1fr); border-left: 1px solid #303737; background: #111616; }
        .decision-metric { padding: 27px 24px; }
        .decision-metric + .decision-metric { border-top: 1px solid #303737; }
        .metric-label { color: #667071; font: 10px monospace; letter-spacing: .13em; text-transform: uppercase; }
        .metric-value { margin-top: 18px; color: #eef0ed; font: 600 28px/1 monospace; letter-spacing: -.06em; }
        .metric-value.mint { color: #6dd4a0; }
        .metric-hint { margin-top: 9px; color: #667071; font-size: 11px; line-height: 1.4; }
        .stat-strip { display: grid; grid-template-columns: repeat(3,1fr); overflow: hidden; border: 1px solid #252b2b; border-radius: 12px; background: #252b2b; margin-bottom: 16px; }
        .stat-cell { min-height: 120px; background: #111616; padding: 22px 24px; }
        .stat-cell + .stat-cell { border-left: 1px solid #252b2b; }
        .stat-value { margin-top: 14px; font: 600 23px/1 monospace; letter-spacing: -.05em; }
        .stat-value.positive { color: #6dd4a0; }
        .stat-value.accent { color: #e6bf3f; }
        .stat-sub { margin-top: 10px; color: #667071; font-size: 11px; }
        .workspace { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(310px,.65fr); gap: 16px; }
        .module { border: 1px solid #252b2b; border-radius: 12px; background: #111616; padding: 24px; }
        .module-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
        .module-kicker { color: #667071; font: 10px monospace; letter-spacing: .14em; text-transform: uppercase; }
        .module-title { margin: 8px 0 0; font-size: 20px; line-height: 1.15; letter-spacing: -.04em; }
        .module-badge { border: 1px solid #303737; border-radius: 999px; padding: 6px 9px; color: #899191; font: 10px monospace; white-space: nowrap; }
        .chart-wrap { position: relative; height: 210px; overflow: hidden; margin: 32px 0 24px; border-top: 1px solid #252b2b; border-bottom: 1px solid #252b2b; background: repeating-linear-gradient(to bottom, transparent 0, transparent 51px, #1d2424 52px); }
        .chart-wrap svg { position: absolute; inset: 14px 0; width: 100%; height: calc(100% - 28px); overflow: visible; }
        .chart-label { position: absolute; left: 0; top: 16px; color: #667071; font: 10px monospace; }
        .chart-readout { position: absolute; right: 0; bottom: 15px; color: #6dd4a0; font: 11px monospace; }
        .session-row { display: grid; grid-template-columns: minmax(120px,1fr) 60px 70px minmax(110px,.8fr); align-items: center; gap: 12px; border-top: 1px solid #252b2b; padding: 13px 0; font: 11px monospace; }
        .session-row > span:nth-child(2), .session-row > span:nth-child(3) { color: #899191; }
        .session-bar { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
        .bar { width: 56px; height: 4px; border-radius: 9px; background: #29443d; }
        .bar.negative { background: #503332; }
        .session-positive { color: #6dd4a0; }
        .session-negative { color: #ef8c78; }
        .desk-read { margin-top: 22px; border-left: 2px solid #e6bf3f; background: rgba(230,191,63,.08); padding: 15px 17px; color: #c5cecc; font-size: 12px; line-height: 1.55; }
        .side-stack { display: grid; gap: 16px; align-content: start; }
        .context-item { display: grid; grid-template-columns: 58px minmax(0,1fr); gap: 14px; border-top: 1px solid #252b2b; padding: 17px 0; }
        .context-time { color: #e6bf3f; font: 11px monospace; }
        .context-name { color: #eef0ed; font-size: 12px; }
        .context-meta { margin-top: 5px; color: #667071; font: 10px monospace; }
        .review-score { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin: 22px 0 18px; }
        .review-score strong { color: #e6bf3f; font: 600 48px/1 monospace; letter-spacing: -.08em; }
        .review-score span { max-width: 110px; color: #899191; font-size: 11px; line-height: 1.45; }
        .review-line { height: 5px; border-radius: 99px; background: #252b2b; }
        .review-line span { display: block; width: 72%; height: 100%; border-radius: 99px; background: #e6bf3f; }
        .text-action { display: inline-flex; margin-top: 19px; color: #e6bf3f; background: none; border: 0; padding: 0; font-size: 12px; font-weight: 700; cursor: pointer; }
        @media (max-width: 980px) { .rework-shell { grid-template-columns: 76px minmax(0,1fr); } .rework-rail { padding: 22px 10px; } .rework-brand { justify-content: center; padding: 0; } .rework-brand span, .rework-rail-label, .rework-nav-item span:not(.rework-nav-no), .rework-rail-bottom { display: none; } .rework-nav { margin-top: 45px; } .rework-nav-item { justify-content: center; padding: 12px 8px; } .rework-nav-no { width: auto; } .workspace { grid-template-columns: 1fr; } }
        @media (max-width: 700px) { .rework-shell { display: block; } .rework-rail { display: none; } .rework-topbar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #252b2b; background: #101313; padding: 16px; } .rework-content { padding: 28px 16px 48px; } .rework-header { display: block; margin-bottom: 22px; } .rework-date { margin-top: 14px; text-align: left; } .decision-surface { display: block; } .decision-main { min-height: auto; padding: 25px 21px; } .decision-side { grid-template-columns: repeat(2,1fr); grid-template-rows: none; border-left: 0; border-top: 1px solid #303737; } .decision-metric { padding: 19px; } .decision-metric + .decision-metric { border-top: 0; border-left: 1px solid #303737; } .decision-title { font-size: 32px; } .decision-footer { display: block; } .secondary-note { display: block; margin-top: 15px; } .stat-strip { grid-template-columns: 1fr; } .stat-cell { min-height: auto; } .stat-cell + .stat-cell { border-top: 1px solid #252b2b; border-left: 0; } .module { padding: 20px; } .module-head { display: block; } .module-badge { display: inline-flex; margin-top: 14px; } .session-row { grid-template-columns: minmax(100px,1fr) 56px 56px; gap: 8px; } .session-bar { grid-column: 1 / -1; justify-content: space-between; } }
      `}</style>
      <div className="rework-page">
        <div className="rework-topbar"><div className="rework-brand"><span className="rework-mark">α</span><span>getALPHA</span></div><div className="rework-status"><span className="rework-dot" /> synced</div></div>
        <div className="rework-shell">
          <aside className="rework-rail">
            <div className="rework-brand"><span className="rework-mark">α</span><span>getALPHA</span></div>
            <div className="rework-rail-label">Workspace</div>
            <nav className="rework-nav">{nav.map(([no, label, active]) => <a className={`rework-nav-item ${active ? "active" : ""}`} href="#" key={no}><span className="rework-nav-no">{no}</span><span>{label}</span></a>)}</nav>
            <div className="rework-rail-bottom"><div className="rework-status"><span className="rework-dot" /> synced</div><div className="rework-account">Alex Morgan<span>Pro workspace</span></div></div>
          </aside>
          <main className="rework-main">
            <div className="rework-content">
              <header className="rework-header"><div><div className="rework-kicker">Monday · 14 October 2026 · 09:42 UTC</div><h1 className="rework-h1">Decision desk</h1><p className="rework-subtitle">A focused read on what matters now, what your record can prove, and where your process needs attention.</p></div><div className="rework-date">XAUUSD<br />market open</div></header>

              <section className="decision-surface">
                <div className="decision-main"><div className="decision-eyebrow"><span className="rework-dot" /> decision context</div><h2 className="decision-title">Your record is profitable. Your process still has one leak.</h2><p className="decision-copy">You logged 590 trades without a defined stop. The pattern appears most often after a losing trade. Review the process before adding more size.</p><div className="decision-footer"><button className="primary-action">Review 7 trades <span>→</span></button><span className="secondary-note">last calculated 4 min ago</span></div></div>
                <div className="decision-side"><div className="decision-metric"><div className="metric-label">Process signal</div><div className="metric-value">7</div><div className="metric-hint">trades to review first</div></div><div className="decision-metric"><div className="metric-label">Terminal status</div><div className="metric-value mint">Live</div><div className="metric-hint">last sync 4 min ago</div></div></div>
              </section>

              <section className="stat-strip">{stats.map(([label, value, hint, tone]) => <div className="stat-cell" key={label}><div className="metric-label">{label}</div><div className={`stat-value ${tone}`}>{value}</div><div className="stat-sub">{hint}</div></div>)}</section>

              <div className="workspace">
                <section className="module"><div className="module-head"><div><div className="module-kicker">Evidence surface</div><h2 className="module-title">Your edge has a time window.</h2></div><div className="module-badge">XAUUSD · 828 trades</div></div><div className="chart-wrap"><span className="chart-label">cumulative P&amp;L · EUR</span><svg viewBox="0 0 800 190" preserveAspectRatio="none" aria-label="Cumulative performance chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6dd4a0" stopOpacity=".26" /><stop offset="1" stopColor="#6dd4a0" stopOpacity="0" /></linearGradient></defs><path d="M0 166 C70 160 75 142 130 148 S190 122 245 136 S290 105 350 115 S410 95 465 102 S510 68 560 84 S630 39 680 52 S745 21 800 25 L800 190 L0 190 Z" fill="url(#chartFill)" /><path d="M0 166 C70 160 75 142 130 148 S190 122 245 136 S290 105 350 115 S410 95 465 102 S510 68 560 84 S630 39 680 52 S745 21 800 25" fill="none" stroke="#6dd4a0" strokeWidth="2" /></svg><span className="chart-readout">+€2,245.97</span></div><div className="module-kicker">Performance by session</div><div className="session-table">{sessionRows.map(([name, trades, rate, pnl, tone]) => <div className="session-row" key={name}><span>{name}</span><span>{trades}</span><span>{rate}</span><div className="session-bar"><span className={`bar ${tone === "negative" ? "negative" : ""}`} /><span className={tone === "negative" ? "session-negative" : "session-positive"}>{pnl}</span></div></div>)}</div><div className="desk-read"><strong>Desk read.</strong> London and the London / New York overlap generated most of this record’s edge. Off-hours are the first place to review before adding size.</div></section>

                <aside className="side-stack"><section className="module"><div className="module-kicker">Market context</div><h2 className="module-title">USD releases are the variable to watch.</h2><p className="rework-subtitle">High impact data may change the range before the next review window.</p><div className="context-item"><span className="context-time">13:30</span><div><div className="context-name">Non-Farm Employment Change</div><div className="context-meta">USD · high impact · in 3h 48m</div></div></div><div className="context-item"><span className="context-time">15:00</span><div><div className="context-name">Consumer Sentiment</div><div className="context-meta">USD · medium impact</div></div></div><button className="text-action">Open calendar →</button></section><section className="module"><div className="module-kicker">Process review</div><div className="review-score"><strong>72</strong><span>of 100<br />record quality score</span></div><div className="review-line"><span /></div><p className="rework-subtitle">The score is held back by sizing after losses and missing stops.</p><button className="text-action">Open journal →</button></section></aside>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
