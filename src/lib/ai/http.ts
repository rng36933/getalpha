import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { AiBudgetError } from "./budget";
import { AiConfigError } from "./client";
import { AiResponseError } from "./invoke";

/**
 * Maps an AI failure onto an HTTP response, keeping provider details out of
 * the body while logging enough to debug from the server side.
 */
export function aiErrorResponse(error: unknown, route: string): NextResponse {
  console.error(`${route} failed:`, error);

  // 402 Payment Required: not a server fault and not worth retrying today.
  if (error instanceof AiBudgetError) {
    return NextResponse.json(
      {
        error: "Daily AI budget reached",
        spentTodayUsd: Number(error.spentTodayUsd.toFixed(6)),
        limitUsd: error.limitUsd,
        reservedForThisCallUsd: Number(error.reserveUsd.toFixed(6)),
      },
      { status: 402 },
    );
  }

  if (error instanceof AiConfigError) {
    return NextResponse.json(
      { error: "AI features are not configured on this server" },
      { status: 503 },
    );
  }

  if (error instanceof AiResponseError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  if (error instanceof Anthropic.AuthenticationError) {
    return NextResponse.json(
      { error: "AI credentials were rejected" },
      { status: 503 },
    );
  }

  if (error instanceof Anthropic.RateLimitError) {
    const retryAfter = error.headers?.get("retry-after");

    return NextResponse.json(
      { error: "AI rate limit reached, try again shortly" },
      {
        status: 429,
        headers: retryAfter ? { "retry-after": retryAfter } : undefined,
      },
    );
  }

  if (error instanceof Anthropic.APIConnectionError) {
    return NextResponse.json(
      { error: "Could not reach the AI provider" },
      { status: 503 },
    );
  }

  if (error instanceof Anthropic.APIError) {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }

  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

export function badRequest(details: string[]): NextResponse {
  return NextResponse.json(
    { error: "Validation failed", details },
    { status: 400 },
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireArray(
  value: unknown,
  field: string,
  errors: string[],
): unknown[] {
  if (!Array.isArray(value)) {
    errors.push(`${field}: required, must be an array`);
    return [];
  }
  return value;
}

export function requireString(
  value: unknown,
  field: string,
  errors: string[],
): string {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field}: required, must be a non-empty string`);
    return "";
  }
  return value.trim();
}

export function requireNumber(
  value: unknown,
  field: string,
  errors: string[],
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${field}: required, must be a finite number`);
    return 0;
  }
  return value;
}
