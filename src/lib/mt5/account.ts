import { prisma } from "@/lib/prisma";

/**
 * The currency the connected terminal reports its account in.
 *
 * Null when no terminal has connected, or when it connected before this field
 * was recorded. Every money figure is then printed bare, without a symbol —
 * see `lib/format/money.ts` for why that is better than assuming.
 *
 * Never throws. A page that cannot read the currency should still render its
 * numbers; a dashboard that 500s because it does not know whether to print a
 * euro sign is a worse outcome than one that prints none.
 */
export async function getAccountCurrency(
  userId: string | null,
): Promise<string | null> {
  if (!userId) return null;

  try {
    // A user may have both an MT5 and an MT4 connection (see the
    // `[userId, platform]` key in schema.prisma) — whichever last reported a
    // currency wins, same tie-break as the dashboard's connection prompt.
    const connections = await prisma.mtConnection.findMany({
      where: { userId },
      select: { currency: true },
      orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
    });

    return connections[0]?.currency ?? null;
  } catch (error) {
    console.error("Could not read the account currency:", error);
    return null;
  }
}
