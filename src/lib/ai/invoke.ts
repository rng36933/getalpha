import type Anthropic from "@anthropic-ai/sdk";
import type { AiFeature } from "@/generated/prisma/client";
import { releaseReservation, reserveBudget, settleReservation } from "./budget";
import { AI_BETAS, AI_MODEL, getAnthropicClient, stableStringify } from "./client";
import type { AiResult, AiUsage } from "./types";

/** Raised when the model declined the request or returned unusable output. */
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiResponseError";
  }
}

type InvokeOptions = {
  /** Which product surface is spending the money. */
  feature: AiFeature;
  userId?: string | null;
  system: string;
  userPayload: unknown;
  instruction: string;
  schema: Record<string, unknown>;
  /** low | medium | high | xhigh | max — controls reasoning depth and spend. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
};

/**
 * One structured, schema-constrained call to Claude.
 *
 * The schema is enforced by the API (`output_config.format`), so the response
 * is guaranteed to parse into the requested shape rather than needing a
 * "please reply in JSON" instruction and a hopeful JSON.parse.
 */
export async function invokeStructured<T>({
  feature,
  userId = null,
  system,
  userPayload,
  instruction,
  schema,
  effort = "medium",
  maxTokens = 8000,
}: InvokeOptions): Promise<AiResult<T>> {
  // Reserved before the request, not counted after: a limit enforced
  // afterwards is a report, not a limit. Reserved before the client is built
  // too, because the budget is a policy decision that does not depend on
  // credentials.
  const reservation = await reserveBudget(feature, userId, AI_MODEL, maxTokens);

  let client;
  try {
    client = getAnthropicClient();
  } catch (error) {
    // Nothing was sent, so nothing was spent.
    await releaseReservation(reservation.id);
    throw error;
  }

  let message: Anthropic.Beta.BetaMessage;

  try {
    message = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      betas: [...AI_BETAS],
      fallbacks: "default",
      // The stable system prompt goes first and is cached; volatile data
      // follows it, so repeated calls only pay full price for the changing
      // part.
      system: [
        {
          type: "text",
          text: system,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        effort,
        format: { type: "json_schema", schema },
      },
      messages: [
        {
          role: "user",
          content: `${instruction}\n\n<data>\n${stableStringify(userPayload)}\n</data>`,
        },
      ],
    });
  } catch (error) {
    // A transport or API failure produced no usage to bill. Holding the
    // reservation would retire budget for a call that never happened.
    await releaseReservation(reservation.id);
    throw error;
  }

  // Settled before the result is inspected. A refused or truncated response
  // still consumed tokens and still costs money, so it must reach the ledger
  // even though the caller is about to get an error.
  const usage = readUsage(message);
  const costUsd = await settleReservation(reservation.id, usage);

  if (message.stop_reason === "refusal") {
    throw new AiResponseError(
      "The request was declined by Claude's safety classifiers.",
    );
  }

  if (message.stop_reason === "max_tokens") {
    throw new AiResponseError(
      "The response was cut off before it was complete. Raise max_tokens.",
    );
  }

  const text = extractText(message.content);

  if (!text) {
    throw new AiResponseError("The model returned no text content.");
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new AiResponseError("The model returned output that is not valid JSON.");
  }

  return { data, usage: { ...usage, costUsd } };
}

function extractText(content: Anthropic.Beta.BetaContentBlock[]): string | null {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  return null;
}

function readUsage(message: Anthropic.Beta.BetaMessage): AiUsage {
  return {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
    // Not AI_MODEL: a safety fallback may have been served by another model,
    // and cost tracking has to bill whichever one actually ran.
    model: message.model,
  };
}
