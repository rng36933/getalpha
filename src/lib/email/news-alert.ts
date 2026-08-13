import { createHash } from "node:crypto";
import type { CalendarInput } from "@/lib/ai/types";
import { fetchEconomicCalendar } from "@/lib/market-data/calendar";
import { prisma } from "@/lib/prisma";
import {
  newsAlertHtml,
  newsAlertSubject,
  newsAlertText,
} from "./news-alert-template";
import { newsAlertRecipients } from "./recipients";
import { fromAddress, resend } from "./resend";

/** Resend accepts at most 100 messages per batch call. */
const RESEND_BATCH = 100;

/**
 * How far ahead of a release the alert should land, and how wide the poll
 * window is around that point.
 *
 * The window has to be wider than the poll interval or a release sitting
 * between two polls never lands inside a lookahead computed from a single
 * instant. At a 10-minute poll interval, a 20-40 minute window guarantees
 * every event is inside it on at least one poll.
 */
const LOOKAHEAD_MIN_MINUTES = 20;
const LOOKAHEAD_MAX_MINUTES = 40;

const RELEVANT_IMPACT = new Set(["HIGH", "MEDIUM"]);

function eventKey(event: CalendarInput): string {
  return createHash("sha256")
    .update(`${event.at ?? event.time}|${event.currency}|${event.title}`)
    .digest("hex");
}

function londonTimeLabel(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso)) + " UK time"
  );
}

export type NewsAlertResult = {
  checked: number;
  eligible: number;
  sent: number;
  failed: number;
  skippedAlreadySent: number;
};

/**
 * Checks today's calendar for USD releases about to happen and mails
 * everyone who asked for a heads-up, once per event.
 *
 * Meant to be polled every few minutes (see the GitHub Actions workflow —
 * Vercel's Hobby cron cannot run more than once a day). Each poll is cheap
 * when nothing is due: one calendar fetch, one query for already-sent keys,
 * no email work.
 */
export async function checkAndSendNewsAlerts(
  now: Date = new Date(),
): Promise<NewsAlertResult> {
  const { data: events } = await fetchEconomicCalendar(now);

  const due = events.filter((event) => {
    if (!RELEVANT_IMPACT.has(event.impact) || event.currency !== "USD") {
      return false;
    }
    if (!event.at) return false;

    const minutesAway = (new Date(event.at).getTime() - now.getTime()) / 60000;
    return minutesAway >= LOOKAHEAD_MIN_MINUTES && minutesAway <= LOOKAHEAD_MAX_MINUTES;
  });

  if (due.length === 0) {
    return { checked: events.length, eligible: 0, sent: 0, failed: 0, skippedAlreadySent: 0 };
  }

  const recipients = await newsAlertRecipients(now);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org";

  let sent = 0;
  let failed = 0;
  let skippedAlreadySent = 0;

  for (const event of due) {
    const key = eventKey(event);

    // Claim the event before sending anything, the same idempotency shape as
    // the daily brief's date claim — the unique key either wins or it does
    // not, so two overlapping polls cannot both mail everyone for one event.
    try {
      await prisma.sentNewsAlert.create({ data: { eventKey: key } });
    } catch {
      skippedAlreadySent += 1;
      continue;
    }

    if (recipients.length === 0) continue;

    const timeLabel = londonTimeLabel(event.at!);
    const input = { event, timeLabel, appUrl };

    const subject = newsAlertSubject(input);
    const html = newsAlertHtml(input);
    const text = newsAlertText(input);

    for (let i = 0; i < recipients.length; i += RESEND_BATCH) {
      const batch = recipients.slice(i, i + RESEND_BATCH);

      const messages = batch.map((recipient) => ({
        from: fromAddress(),
        to: [recipient.email],
        subject,
        html,
        text,
      }));

      try {
        const response = await resend().batch.send(messages);

        if (response.error) {
          failed += batch.length;
          console.error("Resend rejected a news-alert batch:", response.error);
        } else {
          sent += batch.length;
        }
      } catch (error) {
        failed += batch.length;
        console.error("Sending a news-alert batch failed:", error);
      }
    }
  }

  return {
    checked: events.length,
    eligible: due.length,
    sent,
    failed,
    skippedAlreadySent,
  };
}
