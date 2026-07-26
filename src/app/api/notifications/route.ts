import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json({ dailyBrief: preference?.dailyBrief ?? false });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const dailyBrief = (body as { dailyBrief?: unknown })?.dailyBrief;
  if (typeof dailyBrief !== "boolean") {
    return NextResponse.json(
      { error: "dailyBrief: required, must be true or false" },
      { status: 400 },
    );
  }

  try {
    // The row is created on first opt-in rather than at sign-up, so the table
    // holds only people who actually asked for something.
    const preference = await prisma.emailPreference.upsert({
      where: { userId },
      create: { userId, dailyBrief },
      update: { dailyBrief },
    });

    return NextResponse.json({ dailyBrief: preference.dailyBrief });
  } catch (error) {
    console.error("PUT /api/notifications failed:", error);
    return NextResponse.json(
      { error: "Could not save your notification settings" },
      { status: 500 },
    );
  }
}
