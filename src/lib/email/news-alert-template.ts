import type { CalendarInput } from "@/lib/ai/types";

/**
 * The pre-release news alert email.
 *
 * Deliberately describes conditions, never instructs: "spreads may widen" is a
 * fact about how markets behave around a release, "wait until after it prints"
 * is a trading decision this product has never made for anyone. Same line
 * getALPHA draws everywhere else — see the Session Brief prompt.
 */

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type NewsAlertEmailInput = {
  event: CalendarInput;
  /** The event's local time for the reader, formatted e.g. "14:30 UK time". */
  timeLabel: string;
  appUrl: string;
};

export function newsAlertSubject({ event, timeLabel }: NewsAlertEmailInput): string {
  return `In ~30 min: ${event.title} at ${timeLabel}`;
}

export function newsAlertText({
  event,
  timeLabel,
  appUrl,
}: NewsAlertEmailInput): string {
  const forecastLine =
    event.forecast || event.previous
      ? [
          event.forecast ? `Forecast: ${event.forecast}` : null,
          event.previous ? `Previous: ${event.previous}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return [
    `${event.title} (${event.currency}, ${event.impact} impact) is due at ${timeLabel}.`,
    forecastLine,
    "",
    "XAUUSD often reacts sharply to USD data like this. Spreads can widen and price can gap through nearby levels in the minutes around the release.",
    "",
    "This is a heads-up, not a signal — it names what's scheduled, not what to do about it.",
    "",
    `Open the desk: ${appUrl}`,
    `Stop these emails: ${appUrl}/dashboard/settings`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");
}

export function newsAlertHtml({
  event,
  timeLabel,
  appUrl,
}: NewsAlertEmailInput): string {
  const forecastLine =
    event.forecast || event.previous
      ? [
          event.forecast ? `Forecast: ${escape(event.forecast)}` : null,
          event.previous ? `Previous: ${escape(event.previous)}` : null,
        ]
          .filter(Boolean)
          .join(" &middot; ")
      : null;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(newsAlertSubject({ event, timeLabel, appUrl }))}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0b0f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0b0f;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;background-color:#13151c;border:1px solid #252935;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <tr>
          <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #252935;">
            <p style="margin:0;font-size:17px;font-weight:600;color:#e9ebf0;">
              get<span style="color:#f2c94c;">ALPHA</span>
            </p>
            <p style="margin:6px 0 0 0;font-size:13px;color:#8a90a0;">
              Coming up in about 30 minutes
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 8px 32px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:#f87171;background-color:#191c25;">
              ${escape(event.impact)} IMPACT &middot; ${escape(event.currency)}
            </span>
            <p style="margin:12px 0 0 0;font-size:20px;font-weight:600;line-height:1.4;color:#e9ebf0;">
              ${escape(event.title)}
            </p>
            <p style="margin:6px 0 0 0;font-size:14px;color:#8a90a0;">
              ${escape(timeLabel)}
            </p>
            ${
              forecastLine
                ? `<p style="margin:10px 0 0 0;font-size:13px;color:#c7cad3;">${forecastLine}</p>`
                : ""
            }
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 8px 32px;">
            <p style="margin:0;font-size:14px;line-height:1.55;color:#e9ebf0;">
              XAUUSD often reacts sharply to USD data like this. Spreads can widen and price can gap through nearby levels in the minutes around the release.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 24px 32px;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#8a90a0;">
              This is a heads-up, not a signal — it names what's scheduled, not what to do about it.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px 32px;">
            <a href="${escape(appUrl)}"
               style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#f2c94c;color:#0a0b0f;font-size:14px;font-weight:600;text-decoration:none;">
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
              <a href="${escape(appUrl)}/dashboard/settings" style="color:#8a90a0;">Stop receiving these</a>
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
