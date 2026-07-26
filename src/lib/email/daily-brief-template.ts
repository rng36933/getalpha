import type { SessionBrief } from "@/lib/ai/types";

/**
 * The morning email, as a self-contained HTML string.
 *
 * Written by hand rather than with a component library: email clients ignore
 * most of modern CSS, Outlook still renders through Word, and every style has
 * to be inline anyway. A renderer would add a dependency and produce the same
 * table.
 */

const TONE_LABEL: Record<SessionBrief["riskTone"]["tone"], string> = {
  RISK_ON: "Risk on",
  RISK_OFF: "Risk off",
  NEUTRAL: "Neutral",
};

const TONE_COLOUR: Record<SessionBrief["riskTone"]["tone"], string> = {
  RISK_ON: "#34d399",
  RISK_OFF: "#f87171",
  NEUTRAL: "#8a90a0",
};

/** Email bodies are HTML; model output is text and must not be trusted as markup. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function section(title: string, body: string): string {
  return `
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a90a0;">${escape(title)}</p>
        <p style="margin:0;font-size:15px;line-height:1.55;color:#e9ebf0;">${escape(body)}</p>
      </td>
    </tr>`;
}

export type DailyBriefEmailInput = {
  brief: SessionBrief;
  /** Formatted for a human, e.g. "Monday, 27 July". */
  dateLabel: string;
  /** True when some market data source was stale or missing. */
  degraded: boolean;
  appUrl: string;
};

export function dailyBriefSubject(
  brief: SessionBrief,
  dateLabel: string,
): string {
  return `${TONE_LABEL[brief.riskTone.tone]} — London session brief, ${dateLabel}`;
}

/**
 * A plain-text alternative.
 *
 * Not optional politeness: an HTML-only message scores worse with spam filters
 * and is unreadable in clients that block HTML.
 */
export function dailyBriefText({
  brief,
  dateLabel,
  degraded,
  appUrl,
}: DailyBriefEmailInput): string {
  return [
    `London session brief — ${dateLabel}`,
    "",
    `RISK TONE: ${TONE_LABEL[brief.riskTone.tone]}`,
    brief.riskTone.reason,
    "",
    "KEY MARKET DRIVER",
    brief.keyMarketDriver,
    "",
    "VOLATILITY WARNING",
    brief.watchlistVolatilityWarning,
    "",
    degraded
      ? "Note: some market data was stale or unavailable when this was written.\n"
      : "",
    `Open the desk: ${appUrl}`,
    `Stop these emails: ${appUrl}/settings`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function dailyBriefHtml({
  brief,
  dateLabel,
  degraded,
  appUrl,
}: DailyBriefEmailInput): string {
  const tone = brief.riskTone.tone;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(dailyBriefSubject(brief, dateLabel))}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0b0f;">
<!-- Shown in the inbox list under the subject, so the first line of the brief
     is visible before the message is opened. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(brief.keyMarketDriver)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0b0f;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;background-color:#13151c;border:1px solid #252935;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <tr>
          <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #252935;">
            <p style="margin:0;font-size:17px;font-weight:600;color:#e9ebf0;">
              get<span style="color:#5b8cff;">ALPHA</span>
            </p>
            <p style="margin:6px 0 0 0;font-size:13px;color:#8a90a0;">
              London session brief &middot; ${escape(dateLabel)}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 20px 32px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:${TONE_COLOUR[tone]};background-color:#191c25;">
              ${escape(TONE_LABEL[tone])}
            </span>
            <p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:#e9ebf0;">
              ${escape(brief.riskTone.reason)}
            </p>
          </td>
        </tr>

        ${section("Key market driver", brief.keyMarketDriver)}
        ${section("Volatility warning", brief.watchlistVolatilityWarning)}

        ${
          degraded
            ? `<tr>
          <td style="padding:0 32px 24px 32px;">
            <p style="margin:0;padding:12px 14px;border:1px solid rgba(251,191,36,0.3);border-radius:8px;background-color:rgba(251,191,36,0.1);font-size:13px;line-height:1.5;color:#fbbf24;">
              Some market data was stale or unavailable when this was written. Gaps are named rather than filled in.
            </p>
          </td>
        </tr>`
            : ""
        }

        <tr>
          <td style="padding:0 32px 28px 32px;">
            <a href="${escape(appUrl)}"
               style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#5b8cff;color:#0a0b0f;font-size:14px;font-weight:600;text-decoration:none;">
              Open the desk
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 24px 32px;border-top:1px solid #252935;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#8a90a0;">
              This is a market summary, not advice, and not a recommendation to trade.
            </p>
            <p style="margin:8px 0 0 0;font-size:12px;color:#8a90a0;">
              <a href="${escape(appUrl)}/settings" style="color:#8a90a0;">Stop receiving these</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
