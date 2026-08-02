/**
 * A Discord ping when a new support ticket lands.
 *
 * Fire-and-forget on purpose: a visitor submitting a support message must
 * never fail, or wait, on Discord being reachable. Silent no-op when the
 * webhook is unset, same as the daily brief email being unset — a feature
 * nobody has configured yet is not an error.
 *
 * The message is included, the author is not — same call the admin panel's
 * support feed already makes: the person reading a ticket needs to know
 * what was said, not casually who said it.
 */
export function notifySupportTicket(kind: string, message: string): void {
  const webhook = process.env.DISCORD_SUPPORT_WEBHOOK_URL;
  if (!webhook) return;

  // Discord's own message cap, with room for the surrounding text.
  const excerpt =
    message.length > 1500 ? `${message.slice(0, 1500)}…` : message;

  fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content: `**New support ticket** — ${kind}\n${excerpt}`,
    }),
  }).catch((error) => {
    console.error("Could not notify Discord of a new support ticket:", error);
  });
}
