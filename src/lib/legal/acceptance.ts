import { prisma } from "@/lib/prisma";
import { CURRENT_LEGAL_VERSION } from "./documents";

/**
 * Whether this user has accepted the documents as they stand today.
 *
 * Fails closed on a database error. Showing the consent screen to somebody who
 * has already accepted is a small annoyance; letting somebody through without
 * a record is the failure this whole table exists to prevent.
 */
export async function hasAcceptedCurrentTerms(userId: string): Promise<boolean> {
  try {
    const row = await prisma.legalAcceptance.findUnique({
      where: {
        userId_documentVersion: {
          userId,
          documentVersion: CURRENT_LEGAL_VERSION,
        },
      },
      select: { id: true },
    });

    return row !== null;
  } catch (error) {
    console.error(`Could not read the legal acceptance for ${userId}:`, error);
    return false;
  }
}

/**
 * Records an acceptance.
 *
 * Idempotent: clicking twice, or a retried request, must not write a second
 * row and must not move the timestamp of the first. The timestamp is the
 * evidence — the moment they agreed, not the last time the button was pressed.
 */
export async function recordAcceptance(userId: string): Promise<Date> {
  const existing = await prisma.legalAcceptance.findUnique({
    where: {
      userId_documentVersion: {
        userId,
        documentVersion: CURRENT_LEGAL_VERSION,
      },
    },
    select: { acceptedAt: true },
  });

  if (existing) return existing.acceptedAt;

  const created = await prisma.legalAcceptance.create({
    data: { userId, documentVersion: CURRENT_LEGAL_VERSION },
    select: { acceptedAt: true },
  });

  return created.acceptedAt;
}
