import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { eraseUserData } from "@/lib/legal/erase";
import { sendWelcomeEmail } from "@/lib/email/welcome";

type ClerkEventData = {
  id?: string;
  first_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: {
    id: string;
    email_address: string;
    verification?: { status?: string } | null;
  }[];
};

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

  type ClerkEvent = { type?: string; data?: ClerkEventData };

  let event: ClerkEvent;

  try {
    event = new Webhook(secret).verify(payload, headers) as ClerkEvent;
  } catch (error) {
    // A bad signature is a misconfigured secret or a forgery. Neither should be
    // retried, so 400 rather than 500.
    console.error("Clerk webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    return handleUserCreated(event.data ?? {});
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

/**
 * A new Clerk account. Sends the one-time welcome email.
 *
 * Failure here is not retried with a 500: a welcome email is not worth Clerk
 * hammering this endpoint over, and the account itself is already created
 * regardless of whether the email goes out.
 */
async function handleUserCreated(data: ClerkEventData): Promise<NextResponse> {
  const primary = data.email_addresses?.find(
    (address) => address.id === data.primary_email_address_id,
  );

  // An unverified address is one somebody typed, not one they proved they
  // own. Sending there risks mailing a stranger.
  if (!primary || primary.verification?.status !== "verified") {
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    await sendWelcomeEmail(primary.email_address, data.first_name ?? null);
    return NextResponse.json({ received: true, handled: true });
  } catch (error) {
    console.error(`Could not send welcome email for ${data.id}:`, error);
    return NextResponse.json({ received: true, handled: false });
  }
}
