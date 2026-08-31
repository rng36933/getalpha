import Link from "next/link";
import { AlertCircle, Lightbulb, Wifi } from "lucide-react";
import { hasGoneQuiet } from "@/lib/mt5/liveness";

/**
 * The suggestion to connect MetaTrader, on the page somebody actually opens.
 *
 * The connection lived only in Settings, which nothing linked to and nobody
 * visits — so the one feature that fills the journal without typing was
 * effectively hidden behind a page you had to already know about.
 *
 * Renders nothing while the terminal is sending. A prompt that stays up after
 * it has been acted on stops being a prompt and becomes furniture.
 *
 * It does render again when a terminal that used to send goes quiet, and that
 * case is worth stating plainly because it cost hours once: a terminal had been
 * silent for three and a half hours, two positions opened in that time were
 * missing from the desk, and this component hid itself because `receiving` was
 * true — it had sent, once, that morning. The only trace was a grey timestamp
 * on a Settings page nobody had open. Silence after success is a fault, and a
 * fault belongs on the page being looked at.
 */

type Mt5PromptProps = {
  /** A key exists. Not the same as trades arriving. */
  connected: boolean;
  /** The terminal has actually sent something at least once. */
  receiving: boolean;
  /** ISO timestamp of the last sync, or null if the terminal never sent. */
  lastSeenAt: string | null;
};

const REASONS = [
  "📊 Every closed trade lands in the journal automatically — even the ones you'd skip.",
  "⚙️ Stop, size and units come straight from the terminal — exact, not estimated.",
  "⏱️ Ninety days of history arrives on the first sync. Typing it by hand doesn't.",
];

export default function Mt5Prompt({
  connected,
  receiving,
  lastSeenAt,
}: Mt5PromptProps) {
  // Sending, and recently. Nothing to say.
  if (receiving && !hasGoneQuiet(lastSeenAt)) return null;

  // It worked and then stopped. Everything opened since is missing from this
  // page, so the warning sits above the cards that would otherwise look simply
  // empty — which is indistinguishable from a quiet trading day.
  if (receiving) {
    return (
      <section className="surface-lit mb-4 rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-warning flex-shrink-0" />
          <div>
            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-warning">
              🔴 Your terminal has stopped sending
            </h2>

            <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-muted">
              Anything opened since is missing from this desk. Usually MetaTrader is
              just closed. If it&apos;s open, press{" "}
              <span className="text-foreground font-medium">Ctrl+T</span> — no{" "}
              <span className="text-foreground font-medium">getALPHA:</span> line in the last
              two minutes means it&apos;s not running, often because another Expert
              Advisor got attached to the same chart.
            </p>

            <Link
              href="/dashboard/settings"
              className="mt-3 inline-block rounded-lg border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Check connection status
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // A key was generated and nothing ever arrived. Telling this person to
  // "connect MetaTrader" would be answering a question they already answered —
  // what they need is the two things that actually go wrong, because the EA
  // reports both to MetaTrader's Experts tab and nowhere else.
  if (connected) {
    return (
      <section className="surface-lit mb-4 rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="size-5 text-warning flex-shrink-0" />
          <div>
            <h2 className="text-[0.9375rem] font-semibold tracking-tight text-warning">
              ⏳ Waiting for your terminal...
            </h2>

            <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-muted">
              Two things stop it, both a minute&apos;s fix:
            </p>

            <ul className="mt-3 space-y-2 text-[13px] text-muted">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-medium flex-shrink-0">1.</span>
                <span>MetaTrader must be running on your desktop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-medium flex-shrink-0">2.</span>
                <span>
                  Allow{" "}
                  <span className="text-foreground font-medium">
                    https://www.getalpha.org
                  </span>{" "}
                  in Tools → Options → Expert Advisors
                </span>
              </li>
            </ul>

            <Link
              href="/dashboard/settings"
              className="mt-4 inline-block rounded-lg border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              View setup guide
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="surface-lit mb-4 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Wifi className="size-5 text-accent flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Stop typing your trades in
          </p>

          <h2 className="mt-2 max-w-[34ch] text-base font-semibold tracking-tight text-balance sm:text-lg">
            Connect your platform and the journal fills itself.
          </h2>

          <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-muted">
            A small program inside your terminal sends this desk what you traded.
            It only sends, and{" "}
            <span className="text-foreground font-medium">no password is ever involved</span>.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {REASONS.map((reason) => (
              <li key={reason} className="text-[13px] leading-snug text-muted">
                {reason}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/dashboard/settings"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-[filter] hover:brightness-110"
            >
              Connect your platform
            </Link>
            <span className="text-xs text-muted">
              MT5, MT4, cTrader or TradingView — desktop only for the three terminals.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
