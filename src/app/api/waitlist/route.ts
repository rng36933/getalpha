import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { normaliseReferralCode } from "@/lib/referral/code";
import { checkEmail } from "@/lib/referral/email-check";
import { verifyTurnstile } from "@/lib/referral/turnstile";
import { requireJsonRequest } from "@/lib/request-guards";

/**
 * The client IP, for rate limiting only.
 *
 * This route is public, so there is no account to key a limit on. The value is
 * used to count requests and is never stored — the waitlist row holds an email
 * address and nothing else about who submitted it.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * POST /api/waitlist
 *
 * Body: { email, ref?, turnstileToken? }
 *
 * Public. Answers the same way whether or not the address is already on the
 * list, because a form that says "already registered" is a way to find out who
 * has an account here.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);

  const limited = enforceRateLimit(`waitlist:${ip}`, LIMITS.write);
  if (limited) return limited;

  const wrongType = requireJsonRequest(request);
  if (wrongType) return wrongType;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const payload = body as {
    email?: unknown;
    ref?: unknown;
    turnstileToken?: unknown;
  };

  const passed = await verifyTurnstile(payload.turnstileToken, ip);
  if (!passed) {
    return NextResponse.json(
      { error: "Could not verify that you are human. Reload and try again." },
      { status: 403 },
    );
  }

  const checked = checkEmail(payload.email);

  if (!checked.ok) {
    return NextResponse.json(
      {
        error:
          checked.reason === "DISPOSABLE"
            ? "Please use an address you actually read."
            : "That does not look like an email address.",
      },
      { status: 400 },
    );
  }

  const referredByCode = normaliseReferralCode(
    typeof payload.ref === "string" ? payload.ref : null,
  );

  try {
    await prisma.waitlistEntry.upsert({
      where: { email: checked.email },
      // Attribution is set on the first submission only. Otherwise anyone
      // could re-submit somebody else's address through their own link and
      // steal the credit for it.
      create: { email: checked.email, referredByCode },
      update: {},
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error("POST /api/waitlist failed:", error);
    return NextResponse.json(
      { error: "Could not add you to the list. Try again shortly." },
      { status: 500 },
    );
  }
}
