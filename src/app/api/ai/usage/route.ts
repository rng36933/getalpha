import { NextResponse } from "next/server";
import { budgetStatus, startOfUtcDay } from "@/lib/ai/budget";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ai/usage
 *
 * Today's AI spend against the configured daily limit, broken down by feature.
 * The UI uses this to show remaining budget without waiting for a 402.
 */
export async function GET() {
  try {
    const [status, byFeature] = await Promise.all([
      budgetStatus(),
      prisma.aiUsageLog.groupBy({
        by: ["feature"],
        where: { createdAt: { gte: startOfUtcDay() } },
        _sum: {
          costUsd: true,
          inputTokens: true,
          outputTokens: true,
          cacheReadInputTokens: true,
        },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      ...status,
      byFeature: byFeature.map((row) => ({
        feature: row.feature,
        calls: row._count._all,
        costUsd: Number((row._sum.costUsd?.toNumber() ?? 0).toFixed(6)),
        inputTokens: row._sum.inputTokens ?? 0,
        outputTokens: row._sum.outputTokens ?? 0,
        cacheReadInputTokens: row._sum.cacheReadInputTokens ?? 0,
      })),
    });
  } catch (error) {
    console.error("GET /api/ai/usage failed:", error);
    return NextResponse.json(
      { error: "Failed to load AI usage" },
      { status: 500 },
    );
  }
}
