import {
  claimBriefGeneration,
  readBrief,
  releaseFailedClaim,
  storeBrief,
} from "@/lib/ai/brief-cache";
import { generateSessionBrief } from "@/lib/ai/session-brief";
import type { SessionBrief } from "@/lib/ai/types";
import {
  collectMarketSnapshot,
  isSnapshotEmpty,
  toBriefInput,
} from "@/lib/market-data/snapshot";
import { prisma } from "@/lib/prisma";
import {
  dailyBriefHtml,
  dailyBriefSubject,
  dailyBriefText,
} from "./daily-brief-template";
import { dailyBriefRecipients } from "./recipients";
import { fromAddress, resend } from "./resend";

/** Resend accepts at most 100 messages per batch call. */
const RESEND_BATCH = 100;

/**
 * The recipient's calendar day, not the server's.
 *
 * The email is sent before the London open, and in winter London is UTC while
 * in summer it is an hour ahead — a UTC date would put the pre-open email on
 * the wrong day for half the year.
 */
export function londonDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function londonDateLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

export type SendResult = {
  status: "SENT" | "ALREADY_SENT" | "NO_RECIPIENTS" | "NO_BRIEF";
  briefDate: string;
  recipientCount: number;
  failureCount: number;
  detail?: string;
};

/**
 * Today's London brief, generating it if nobody has asked for one yet.
 *
 * At 07:30 the desk is usually empty, so reading the cache alone would mean the
 * email almost never goes out. Generation goes through the same claim as the
 * API route, so the cron job and an early user cannot both pay for one.
 */
async function briefForToday(
  now: Date,
): Promise<{ brief: SessionBrief; degraded: boolean } | null> {
  const cached = await readBrief("LONDON", now);
  if (cached && !cached.stale) {
    return { brief: cached.brief, degraded: cached.degraded };
  }

  const { won } = await claimBriefGeneration("LONDON", now);

  if (!won) {
    // Somebody else is generating. A slightly stale brief is still worth
    // sending; nothing at all is not.
    return cached ? { brief: cached.brief, degraded: cached.degraded } : null;
  }

  try {
    const snapshot = await collectMarketSnapshot("LONDON", now);

    if (isSnapshotEmpty(snapshot)) {
      await releaseFailedClaim("LONDON", now);
      return null;
    }

    const input = toBriefInput(snapshot);
    const { data, usage } = await generateSessionBrief(input, null);

    await storeBrief("LONDON", data, input, snapshot.degraded, usage, new Date());
    return { brief: data, degraded: snapshot.degraded };
  } catch (error) {
    await releaseFailedClaim("LONDON", now);
    throw error;
  }
}

/**
 * Sends the morning brief, at most once per London day.
 *
 * The claim is taken before any work: Vercel's scheduler makes no
 * exactly-once promise, and two concurrent invocations that both read "not
 * sent yet" would mail everybody twice. The insert either wins or it does not.
 */
export async function sendDailyBrief(now: Date = new Date()): Promise<SendResult> {
  const briefDate = londonDateKey(now);

  try {
    await prisma.dailyBriefEmail.create({ data: { briefDate } });
  } catch {
    return {
      status: "ALREADY_SENT",
      briefDate,
      recipientCount: 0,
      failureCount: 0,
    };
  }

  try {
    const recipients = await dailyBriefRecipients(now);

    if (recipients.length === 0) {
      // Release the day. Nothing was sent and nothing was spent, so somebody
      // who opts in later this morning should still get today's brief rather
      // than being told it already went out.
      await prisma.dailyBriefEmail.delete({ where: { briefDate } }).catch(() => {});

      return {
        status: "NO_RECIPIENTS",
        briefDate,
        recipientCount: 0,
        failureCount: 0,
      };
    }

    const result = await briefForToday(now);

    if (!result) {
      // Release the day so a later run can try again rather than the day being
      // silently marked done with nothing sent.
      await prisma.dailyBriefEmail.delete({ where: { briefDate } }).catch(() => {});

      return {
        status: "NO_BRIEF",
        briefDate,
        recipientCount: 0,
        failureCount: 0,
        detail: "No brief could be produced from the available market data",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.getalpha.org";
    const dateLabel = londonDateLabel(now);
    const input = { brief: result.brief, dateLabel, degraded: result.degraded, appUrl };

    const subject = dailyBriefSubject(result.brief, dateLabel);
    const html = dailyBriefHtml(input);
    const text = dailyBriefText(input);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += RESEND_BATCH) {
      const batch = recipients.slice(i, i + RESEND_BATCH);

      // One message per recipient, never one message with everybody in `to` —
      // that would show every subscriber the whole customer list.
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
          console.error("Resend rejected a batch:", response.error);
        } else {
          sent += batch.length;
        }
      } catch (error) {
        failed += batch.length;
        console.error("Sending a batch of the daily brief failed:", error);
      }
    }

    await prisma.dailyBriefEmail.update({
      where: { briefDate },
      data: { recipientCount: sent, failureCount: failed },
    });

    return {
      status: "SENT",
      briefDate,
      recipientCount: sent,
      failureCount: failed,
    };
  } catch (error) {
    // The day was claimed but nothing went out; let the next run retry.
    await prisma.dailyBriefEmail.delete({ where: { briefDate } }).catch(() => {});
    throw error;
  }
}
