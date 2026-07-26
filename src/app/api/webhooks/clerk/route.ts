import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { eraseUserData } from "@/lib/legal/erase";

/**
 * POST /api/webhooks/clerk
 *
 * Clerk owns identity, so an account is deleted there, not here — and nothing
 * would tell this database about it. Without this route a "deleted" account
 * leaves its trades, subscription and preferences behind indefinitely, which
 * is both a broken promise in the privacy policy and a breach of the right to
 * erasure.
 *
 * Public in the middleware: Clerk has no session with itself. The svix
 * signature over the raw body is what authenticates it.
 */
export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set; refusing the webhook.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // The raw body, byte for byte. Parsing and re-serialising changes the bytes
  // and the signature never verifies again.
  const payload = await request.text();

  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: { type?: string; data?: { id?: string } };

  try {
    event = new Webhook(secret).verify(payload, headers) as typeof event;
  } catch (error) {
    // A bad signature is a misconfigured secret or a forgery. Neither should be
    // retried, so 400 rather than 500.
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.deleted") {
    return NextResponse.json({ received: true, handled: false });
  }

  const userId = event.data?.id;
  if (!userId) {
    // Nothing to act on, and retrying will not produce an id.
    console.error("Clerk user.deleted arrived without a user id.");
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    const result = await eraseUserData(userId);

    console.log(
      `Erased data for deleted account ${userId}:`,
      JSON.stringify(result),
    );

    return NextResponse.json({ received: true, handled: true, ...result });
  } catch (error) {
    // 500 asks Clerk to retry. Erasure is idempotent — a second run finds
    // nothing left and deletes nothing — so a retry is safe.
    console.error(`Could not erase data for deleted account ${userId}:`, error);
    return NextResponse.json({ error: "Erasure failed" }, { status: 500 });
  }
}
