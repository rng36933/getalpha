import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireJsonRequest } from "@/lib/request-guards";

function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}

/** GET /api/notifications — the signed-in user's email preferences. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  try {
    const preference = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    // No row means never opted in, which is off rather than unknown.
    return NextResponse.json({
      dailyBrief: preference?.dailyBrief ?? false,
      newsAlerts: preference?.newsAlerts ?? false,
    });
  } catch (error) {
    console.error("GET /api/notifications failed:", error);
    return NextResponse.json(
      { error: "Could not load your notification settings" },
      { status: 500 },
    );
  }
}

/** PUT /api/notifications — body { dailyBrief: boolean }. */
export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

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

  const payload = body as { dailyBrief?: unknown; newsAlerts?: unknown };

  // Either field may be sent alone — the settings page saves one checkbox at
  // a time — so only the fields actually present are validated and written.
  if (payload.dailyBrief !== undefined && typeof payload.dailyBrief !== "boolean") {
    return NextResponse.json(
      { error: "dailyBrief must be true or false" },
      { status: 400 },
    );
  }
  if (payload.newsAlerts !== undefined && typeof payload.newsAlerts !== "boolean") {
    return NextResponse.json(
      { error: "newsAlerts must be true or false" },
      { status: 400 },
    );
  }
  if (payload.dailyBrief === undefined && payload.newsAlerts === undefined) {
    return NextResponse.json(
      { error: "dailyBrief or newsAlerts is required" },
      { status: 400 },
    );
  }

  const dailyBrief = payload.dailyBrief as boolean | undefined;
  const newsAlerts = payload.newsAlerts as boolean | undefined;

  try {
    // The row is created on first opt-in rather than at sign-up, so the table
    // holds only people who actually asked for something. A field left out of
    // this request keeps its existing value on update, and defaults to false
    // (the schema default) if this is the row's first write.
    const preference = await prisma.emailPreference.upsert({
      where: { userId },
      create: { userId, dailyBrief: dailyBrief ?? false, newsAlerts: newsAlerts ?? false },
      update: {
        ...(dailyBrief !== undefined ? { dailyBrief } : {}),
        ...(newsAlerts !== undefined ? { newsAlerts } : {}),
      },
    });

    return NextResponse.json({
      dailyBrief: preference.dailyBrief,
      newsAlerts: preference.newsAlerts,
    });
  } catch (error) {
    console.error("PUT /api/notifications failed:", error);
    return NextResponse.json(
      { error: "Could not save your notification settings" },
      { status: 500 },
    );
  }
}
