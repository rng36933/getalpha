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
    const connection = await prisma.mtConnection.findUnique({
      where: { userId },
      select: { currency: true },
    });

    return connection?.currency ?? null;
  } catch (error) {
    console.error("Could not read the account currency:", error);
    return null;
  }
}
