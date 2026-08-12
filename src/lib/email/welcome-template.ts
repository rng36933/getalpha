/**
 * The welcome email, sent once when a Clerk account is created.
 *
 * Same hand-written inline-CSS approach as the daily brief template, for the
 * same reason: email clients need it and a renderer would just produce this.
 */

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type WelcomeEmailInput = {
  /** First name from Clerk, when they gave one. */
  firstName: string | null;
  appUrl: string;
};

export function welcomeSubject(): string {
  return "Welcome to getALPHA";
}

export function welcomeText({ firstName, appUrl }: WelcomeEmailInput): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  return [
    greeting,
    "",
    "Your getALPHA account is live. Here's how to get your first real number on the board:",
    "",
    "1. Connect MetaTrader — Settings > MT5 Connection. Ninety days of closed trades sync on the first pass, nothing typed by hand.",
    "2. Open the Journal — every synced trade already has its P&L and risk computed from your own record.",
    "3. Trade normally — closed positions keep landing in the journal by themselves.",
    "",
    "The journal, charts, and calendar are free for as long as you use them. No card, no trial clock.",
    "",
    `Open the desk: ${appUrl}/dashboard`,
    `Questions? Just reply to this email.`,
  ].join("\n");
}

export function welcomeHtml({ firstName, appUrl }: WelcomeEmailInput): string {
  const greeting = firstName ? `Hi ${escape(firstName)},` : "Hi,";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(welcomeSubject())}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0b0f;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Connect MetaTrader and your first synced trade is a few minutes away.</div>

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
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 4px 32px;">
            <p style="margin:0 0 12px 0;font-size:15px;line-height:1.55;color:#e9ebf0;">
              ${greeting}
            </p>
            <p style="margin:0;font-size:15px;line-height:1.55;color:#e9ebf0;">
              Your account is live. Here's how to get your first real number on the board:
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 8px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 0 14px 0;vertical-align:top;width:28px;font-size:14px;font-weight:600;color:#f2c94c;">1.</td>
                <td style="padding:0 0 14px 0;font-size:14px;line-height:1.5;color:#c7cad3;">
                  <strong style="color:#e9ebf0;">Connect MetaTrader</strong> — Settings &gt; MT5 Connection. Ninety days of closed trades sync on the first pass, nothing typed by hand.
                </td>
              </tr>
              <tr>
                <td style="padding:0 0 14px 0;vertical-align:top;width:28px;font-size:14px;font-weight:600;color:#f2c94c;">2.</td>
                <td style="padding:0 0 14px 0;font-size:14px;line-height:1.5;color:#c7cad3;">
                  <strong style="color:#e9ebf0;">Open the Journal</strong> — every synced trade already has its P&amp;L and risk computed from your own record.
                </td>
              </tr>
              <tr>
                <td style="padding:0;vertical-align:top;width:28px;font-size:14px;font-weight:600;color:#f2c94c;">3.</td>
                <td style="padding:0;font-size:14px;line-height:1.5;color:#c7cad3;">
                  <strong style="color:#e9ebf0;">Trade normally</strong> — closed positions keep landing in the journal by themselves.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0 32px;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#8a90a0;">
              The journal, charts and calendar are free for as long as you use them. No card, no trial clock.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 28px 32px;">
            <a href="${escape(appUrl)}/dashboard"
               style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#f2c94c;color:#0a0b0f;font-size:14px;font-weight:600;text-decoration:none;">
              Open the desk
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 24px 32px;border-top:1px solid #252935;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:#8a90a0;">
              Questions? Just reply to this email — a person reads it.
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
