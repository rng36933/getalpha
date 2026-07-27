import Link from "next/link";
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
  "Every closed trade lands in the journal by itself — including the ones you would never have bothered to type in, which are usually the ones worth reading later.",
  "The stop, the size and the units per lot come from the terminal, so the risk and the result are exact rather than approximate.",
  "The per-pair breakdown needs a body of trades before it can say anything. Ninety days of history arrives on the first sync; typing it by hand does not happen.",
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
      <section className="surface-lit mb-4 rounded-xl border border-warning/30 p-4 sm:p-5">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-warning">
          Your terminal has stopped sending
        </h2>

        <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted">
          Nothing has arrived for a while, so any position opened since then is
          missing from this desk and the cards below are incomplete. Usually
          MetaTrader is simply closed — it has to be running. If it is open,
          press <span className="text-foreground">Ctrl+T</span> and look at the
          Experts tab: no line beginning{" "}
          <span className="text-foreground">getALPHA:</span> in the last two
          minutes means the program is not running, and the usual reason is that
          another Expert Advisor was attached to the same chart. MetaTrader
          allows one per chart and replaces the old one without saying so.
        </p>

        <Link
          href="/dashboard/settings"
          className="mt-3.5 inline-block rounded-lg border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          See when it last sent
        </Link>
      </section>
    );
  }

  // A key was generated and nothing ever arrived. Telling this person to
  // "connect MetaTrader" would be answering a question they already answered —
  // what they need is the two things that actually go wrong, because the EA
  // reports both to MetaTrader's Experts tab and nowhere else.
  if (connected) {
    return (
      <section className="surface-lit mb-4 rounded-xl border border-warning/30 p-4 sm:p-5">
        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-warning">
          Your key is waiting for the terminal
        </h2>

        <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted">
          Nothing has arrived yet. Two things stop it, both fixable in a minute:
          MetaTrader has to be running, and it blocks every outbound request
          until <span className="text-foreground">https://www.getalpha.org</span>{" "}
          is added under Tools → Options → Expert Advisors. The program reports
          which one it is in MetaTrader&rsquo;s Experts tab.
        </p>

        <Link
          href="/dashboard/settings"
          className="mt-3.5 inline-block rounded-lg border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          Check the steps
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-lit mb-4 rounded-xl border border-accent/30 p-4 sm:p-5">
      <p className="eyebrow text-accent">Stop typing your trades in</p>

      <h2 className="mt-1.5 max-w-[34ch] text-base font-semibold tracking-tight text-balance sm:text-lg">
        Connect MetaTrader and the journal fills itself.
      </h2>

      <p className="mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-muted">
        A small program runs inside your terminal and sends this desk what you
        traded. It only ever sends — it cannot place an order or change one, and{" "}
        <span className="text-foreground">
          there is no password involved anywhere
        </span>
        : your terminal connects to us, never the other way round.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {REASONS.map((reason) => (
          <li
            key={reason}
            className="grid grid-cols-[0.9rem_1fr] gap-2 text-[13px] leading-snug text-muted"
          >
            <span aria-hidden="true" className="text-accent">
              →
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/dashboard/settings"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition-[filter] hover:brightness-110"
        >
          Connect MetaTrader
        </Link>
        <span className="text-xs text-muted">
          Five steps, desktop terminal only — one of them is compiling the file, which is the one everybody misses. The phone app cannot run programs.
        </span>
      </div>
    </section>
  );
}
