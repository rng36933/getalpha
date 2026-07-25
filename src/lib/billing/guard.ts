import { NextResponse } from "next/server";
import { checkAccess } from "./subscription";

/**
 * Gate for the paid modules.
 *
 * Returns null when the user may proceed, or the response to send back when
 * they may not. Written this way so a route reads as one early return rather
 * than wrapping its whole body in a conditional.
 *
 * 403 rather than 402: 402 already means "the daily AI budget is spent" in this
 * app, which is a server-side limit the user cannot buy their way past. A
 * client needs to tell the two apart to show the right message.
 */
export async function requirePaidAccess(
  userId: string,
): Promise<NextResponse | null> {
  const access = await checkAccess(userId);

  if (access.allowed) return null;

  if (access.reason === "UNKNOWN") {
    return NextResponse.json(
      { error: "Could not verify your subscription. Try again shortly." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      error: "This module is part of the Pro plan",
      reason: "SUBSCRIPTION_REQUIRED",
      upgradeUrl: "/pricing",
    },
    { status: 403 },
  );
}
