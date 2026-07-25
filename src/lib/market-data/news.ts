import type { NewsInput } from "@/lib/ai/types";
import { recallSnapshot, rememberSnapshot } from "./store";
import {
  describeError,
  fetchWithTimeout,
  type SourceResult,
} from "./types";

/**
 * RSS needs no API key, which makes it the one source that cannot run out of
 * quota. Both feeds below timestamp with an explicit zone — feeds that publish
 * a bare "2026-07-24 20:44:25" were rejected, because Node reads those as local
 * time and the server's zone is not the publisher's.
 */
const FEEDS = [
  { url: "https://www.fxstreet.com/rss/news", source: "FXStreet" },
  {
    url: "https://www.investing.com/rss/market_overview.rss",
    source: "Investing.com",
  },
] as const;

const MAX_HEADLINES = 12;

/**
 * Three days, not one.
 *
 * An 18-hour window emptied the list every weekend: on a Saturday evening the
 * newest market headline is routinely from Friday's close, roughly 24 hours
 * back, and the brief then claimed there was no news at all.
 */
const MAX_AGE_MS = 72 * 60 * 60 * 1000;

/** Minimal RSS extraction. A dependency for this would not earn its weight. */
function parseFeed(xml: string, source: string): NewsInput[] {
  const items: string[] = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items
    // Annotated, so the literal widens to NewsInput. Without it the inferred
    // `summary: null` is narrower than NewsInput's `string | null` and the
    // type predicate on filter() below is rejected.
    .map((item): NewsInput | null => {
      const title = extractTag(item, "title");
      const pubDate = extractTag(item, "pubDate");

      if (!title || !pubDate) return null;

      const published = new Date(pubDate);
      if (Number.isNaN(published.getTime())) return null;

      return {
        title,
        source,
        publishedAt: published.toISOString(),
        summary: null,
      };
    })
    .filter((n): n is NewsInput => n !== null);
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;

  return decodeEntities(
    match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .trim(),
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Ampersand last, or it would corrupt the entities above.
    .replace(/&amp;/g, "&");
}

/** Recent headlines across the feeds, newest first. */
export async function fetchNewsHeadlines(
  now: Date = new Date(),
): Promise<SourceResult<NewsInput[]>> {
  try {
    const settled = await Promise.allSettled(
      FEEDS.map(async (feed) => {
        const response = await fetchWithTimeout(feed.url);
        if (!response.ok) {
          throw new Error(`${feed.source}: returned ${response.status}`);
        }
        return parseFeed(await response.text(), feed.source);
      }),
    );

    const cutoff = now.getTime() - MAX_AGE_MS;

    const headlines = settled
      .filter((r): r is PromiseFulfilledResult<NewsInput[]> => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .filter((n) => new Date(n.publishedAt).getTime() > cutoff)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, MAX_HEADLINES);

    const failures = settled
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => describeError(r.reason));

    // Only a total failure is a failure. A feed that answers but has nothing
    // recent is a quiet news day, not an outage, and must not be replaced by a
    // stale fallback that would look fresher than reality.
    if (failures.length === FEEDS.length) {
      throw new Error(failures.join("; "));
    }

    if (headlines.length > 0) {
      await rememberSnapshot("NEWS_HEADLINES", headlines);
    }

    return {
      data: headlines,
      status: "LIVE",
      fetchedAt: now.toISOString(),
      error: failures.length > 0 ? failures.join("; ") : undefined,
    };
  } catch (error) {
    const reason = describeError(error);
    const stored = await recallSnapshot<NewsInput[]>("NEWS_HEADLINES");

    if (!stored) {
      return { data: [], status: "UNAVAILABLE", fetchedAt: null, error: reason };
    }

    return {
      data: stored.data,
      status: "CACHED",
      fetchedAt: stored.fetchedAt.toISOString(),
      error: reason,
    };
  }
}
