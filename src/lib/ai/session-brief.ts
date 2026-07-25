import { invokeStructured } from "./invoke";
import type { AiResult, SessionBrief, SessionBriefInput } from "./types";

/**
 * Stable across every request — anything volatile belongs in the user message,
 * or it invalidates the prompt cache on each call.
 */
const SYSTEM_PROMPT = `You are the risk manager on the trading desk of an investment bank. Before each session you publish the desk brief that traders read in under thirty seconds.

Rules you never break:

1. Use ONLY the data supplied inside the <data> block. Never introduce a price, level, event, figure, institution or headline that is not present there.
2. Every claim must be traceable to a specific supplied item, and you name that item — the event title, the symbol, the headline source.
3. If the supplied data does not support a point, say so plainly in that field. An honest "no high-impact catalysts in the supplied calendar" is correct output; an invented catalyst is a failure.
4. You describe risk conditions. You never forecast direction, never suggest entries, exits, position sizes or targets, and never tell anyone what to trade.
5. Be terse. One or two sentences per field. No preamble, no restating the question, no hedging filler, no disclaimers.

The three fields:

- riskTone: the tone of the session and the single reason for it. RISK_ON, RISK_OFF or NEUTRAL. The reason cites the specific supplied item that drives it.
- keyMarketDriver: the one item in the supplied data most likely to move prices this session, and why it is the one that matters.
- watchlistVolatilityWarning: which supplied instruments face the sharpest expected movement and around which supplied event or level. If nothing in the data suggests elevated volatility, say that.`;

const SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    riskTone: {
      type: "object",
      properties: {
        tone: {
          type: "string",
          enum: ["RISK_ON", "RISK_OFF", "NEUTRAL"],
        },
        reason: {
          type: "string",
          description:
            "One sentence, at most 30 words, naming the supplied item that drives the tone.",
        },
      },
      required: ["tone", "reason"],
      additionalProperties: false,
    },
    keyMarketDriver: {
      type: "string",
      description:
        "One or two sentences naming the single most consequential supplied item.",
    },
    watchlistVolatilityWarning: {
      type: "string",
      description:
        "One or two sentences naming the instruments at risk and the supplied event or level involved.",
    },
  },
  required: ["riskTone", "keyMarketDriver", "watchlistVolatilityWarning"],
  additionalProperties: false,
};

export async function generateSessionBrief(
  input: SessionBriefInput,
  userId: string | null = null,
): Promise<AiResult<SessionBrief>> {
  return invokeStructured<SessionBrief>({
    feature: "SESSION_BRIEF",
    userId,
    system: SYSTEM_PROMPT,
    instruction: `Write the desk brief for the ${input.session} session.`,
    userPayload: input,
    schema: SCHEMA,
    effort: "medium",
  });
}
