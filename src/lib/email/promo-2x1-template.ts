/**
 * The 2026-09-28 "2-for-1" promo email — one-off campaign, same hand-written
 * inline-CSS approach as the other templates, for the same email-client reason.
 *
 * Not meant to grow into a general campaign-template system: this exists to
 * be sent once, by `POST /api/admin/send-promo`, and can be deleted once the
 * offer in `billing/promo.ts` has run its course.
 */

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type Promo2x1Input = {
  firstName: string | null;
  appUrl: string;
};

export function promo2x1Subject(): string {
  return "Buy one period of getALPHA Pro, get the next free";
}

export function promo2x1Text({ firstName, appUrl }: Promo2x1Input): string {
  const greeting = firstName ? `Hi ${firstName},` : "Hi,";

  return [
    greeting,
    "",
    "For the next two weeks, subscribing to getALPHA Pro gets you double the time for the same price: subscribe monthly and your first two months are covered by one payment, or subscribe yearly and your first two years are.",
    "",
    "Pro unlocks the AI Session Brief before every session and the AI Coach process review on any trade — on top of everything already free (journal, live charts, economic calendar).",
    "",
    `Claim it: ${appUrl}/dashboard/pricing`,
    "",
    "Offer ends October 12. After that, pricing goes back to normal — no pressure either way.",
    "",
    "Questions? Just reply to this email.",
  ].join("\n");
}

export function promo2x1Html({ firstName, appUrl }: Promo2x1Input): string {
  const greeting = firstName ? `Hi ${escape(firstName)},` : "Hi,";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(promo2x1Subject())}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0b0f;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Subscribe now and the next billing period is on us — ends October 12.</div>

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
              For the next two weeks, getALPHA Pro is 2-for-1: subscribe monthly and get two months for one payment, or subscribe yearly and get two years for one payment.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 8px 32px;">
            <p style="margin:0;font-size:14px;line-height:1.55;color:#c7cad3;">
              Pro unlocks the <strong style="color:#e9ebf0;">AI Session Brief</strong> before every session and the <strong style="color:#e9ebf0;">AI Coach</strong> process review on any trade — on top of everything already free.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 0 32px;">
            <a href="${escape(appUrl)}/dashboard/pricing"
               style="display:inline-block;padding:11px 20px;border-radius:8px;background-color:#f2c94c;color:#0a0b0f;font-size:14px;font-weight:600;text-decoration:none;">
              Claim the offer
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 0 32px;">
            <p style="margin:0;font-size:13px;line-height:1.5;color:#8a90a0;">
              Offer ends October 12. After that, pricing goes back to normal — no pressure either way.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 32px 24px 32px;border-top:1px solid #252935;margin-top:20px;">
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
