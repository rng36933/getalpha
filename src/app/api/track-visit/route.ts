import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LIMITS, enforceRateLimit } from "@/lib/rate-limit";
import { requireJsonRequest } from "@/lib/request-guards";

const VISITOR_COOKIE = "visitor_id";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/**
 * POST /api/track-visit
 *
 * Body: { path: string }
 *
 * Public, called once per page load from the marketing site only — never from
 * inside the authenticated app. Records a page view keyed by an anonymous
 * cookie so "unique visitors" can be counted without storing anything that
 * identifies a person: no IP, no user agent, no query string.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);

  const limited = enforceRateLimit(`track-visit:${ip}`, LIMITS.write);
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

  const path = (body as { path?: unknown }).path;
  if (typeof path !== "string" || path.length === 0 || path.length > 200) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const existingVisitorId = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${VISITOR_COOKIE}=`))
    ?.slice(VISITOR_COOKIE.length + 1);

  const visitorId = existingVisitorId || randomUUID();

  try {
    await prisma.pageView.create({ data: { path, visitorId } });
  } catch (error) {
    console.error("POST /api/track-visit failed:", error);
    // A missed page view is not worth failing the page load over.
  }

  const response = NextResponse.json({ ok: true });

  if (!existingVisitorId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  }

  return response;
}
