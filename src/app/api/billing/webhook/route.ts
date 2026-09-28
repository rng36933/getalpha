import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { sellingIsAllowed, verifyIpn } from "@/lib/billing/paypal";
import { applyIpn, claimEvent, type IpnFields } from "@/lib/billing/subscription";

/**
 * Events worth acting on. PayPal's classic IPN sends several other
 * `txn_type`s (e.g. `subscr_modify`), and answering 200 to the rest keeps
 * them out of the retry queue.
 */
const HANDLED = new Set([
  "subscr_signup",
  "subscr_payment",
  "subscr_cancel",
  "subscr_eot",
  "subscr_failed",
]);

/**
 * POST /api/billing/webhook
 *
 * The only thing in the app that grants or revokes paid access. The browser
 * coming back from PayPal's return URL proves nothing — a user can navigate
 * there directly — so entitlement is written here, from a verified IPN
 * message. This route is public in the middleware: PayPal has no Clerk
 * session, and this message's own round-trip verification is what
 * authenticates it (see `verifyIpn`).
 */
export async function POST(request: Request) {
  // The raw body, byte for byte — verification re-sends these exact bytes
  // back to PayPal, so parsing first and re-serialising would break it.
  const rawBody = await request.text();

  let verified: boolean;
  try {
    verified = await verifyIpn(rawBody);
  } catch (error) {
    console.error("PayPal IPN verification request failed:", error);
    // 502 asks PayPal to retry — this is our reachability problem, not a bad
    // message, and access must not be granted on an unverified body.
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  if (!verified) {
    console.error("PayPal IPN did not verify — stale, altered, or forged.");
    return NextResponse.json({ error: "Invalid IPN" }, { status: 400 });
  }

  const fields = Object.fromEntries(new URLSearchParams(rawBody)) as IpnFields;
  const txnType = fields.txn_type;

  // Entitlement is written here and nowhere else, so this is the last place a
  // sandbox payment can be stopped from becoming a real subscription. Classic
  // IPN carries no live/sandbox flag of its own — the gate is entirely
  // `sellingIsAllowed()`, which already fails closed on a sandbox-configured
  // production deployment. 200 rather than an error, because PayPal must not
  // retry something that will never be accepted.
  if (!sellingIsAllowed()) {
    console.error(`Ignoring PayPal ${txnType} (sandbox on the live deployment).`);
    return NextResponse.json({ received: true, handled: false });
  }

  if (!txnType || !HANDLED.has(txnType)) {
    return NextResponse.json({ received: true, handled: false });
  }

  // Classic IPN carries no event id to dedupe on — a verified message's own
  // bytes are hashed instead, since a retried delivery resends them unchanged.
  const eventId = crypto.createHash("sha256").update(rawBody).digest("hex");

  const isNew = await claimEvent(eventId, txnType);
  if (!isNew) {
    // Already applied by an earlier delivery of the same message.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await applyIpn(fields);
    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    // 500 asks PayPal to retry. The event id is already claimed, so release it
    // or the retry would be discarded as a duplicate and access would never be
    // granted.
    await releaseEvent(eventId);

    console.error(`PayPal IPN ${txnType} failed:`, error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function releaseEvent(eventId: string): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.processedPaypalEvent.delete({ where: { id: eventId } });
  } catch (error) {
    console.error(`Could not release the claim on event ${eventId}:`, error);
  }
}
