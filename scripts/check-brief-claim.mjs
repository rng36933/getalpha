// Run with: node scripts/check-brief-claim.mjs
// Needs DIRECT_URL or DATABASE_URL. Deletes and rewrites today's SessionBriefCache
// rows for LONDON, so do not run it against a database you care about.

/**
 * Concurrency check for the session-brief claim.
 *
 * Runs the same two statements the Prisma code runs — an insert guarded by the
 * unique constraint, then a conditional update — from many connections at once,
 * and asserts that exactly one caller ends up owning the generation.
 */
import "dotenv/config";
import { Client } from "pg";

const URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const SESSION = "LONDON";
const DATE = new Date().toISOString().slice(0, 10);
const TTL_MS = 4 * 60 * 60 * 1000;
const CLAIM_TIMEOUT_MS = 3 * 60 * 1000;
const CONCURRENCY = 8;

async function claim(label) {
  const c = new Client({ connectionString: URL });
  await c.connect();
  try {
    // Exactly the statement claimBriefGeneration runs.
    const res = await c.query(
      `INSERT INTO "SessionBriefCache"
         (id, session, "briefDate", status, "claimedAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1::"TradingSession", $2, 'PENDING', now(), now(), now())
       ON CONFLICT (session, "briefDate") DO UPDATE
         SET status = 'PENDING', "claimedAt" = now(), "updatedAt" = now()
         WHERE ("SessionBriefCache".status = 'READY'
                  AND "SessionBriefCache"."generatedAt" < now() - make_interval(secs => $3))
            OR "SessionBriefCache".status = 'FAILED'
            OR ("SessionBriefCache".status = 'PENDING'
                  AND "SessionBriefCache"."claimedAt" < now() - make_interval(secs => $4))`,
      [SESSION, DATE, TTL_MS / 1000, CLAIM_TIMEOUT_MS / 1000],
    );
    return { label, won: res.rowCount === 1, via: "upsert" };
  } finally {
    await c.end();
  }
}

async function reset(sql) {
  const c = new Client({ connectionString: URL });
  await c.connect();
  await c.query(`DELETE FROM "SessionBriefCache" WHERE "briefDate" = $1`, [DATE]);
  if (sql) await c.query(sql.text, sql.values);
  await c.end();
}

function report(name, results, expected) {
  const winners = results.filter((r) => r.won);
  const ok = winners.length === expected;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}: ${winners.length} winner(s) of ${results.length}, expected ${expected}` +
      (winners.length ? `  [via ${winners.map((w) => w.via).join(",")}]` : ""),
  );
  return ok;
}

let allOk = true;

// 1. Cold start: nothing cached, everyone races.
await reset(null);
allOk &= report(
  "cold start",
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => claim(i))),
  1,
);

// 2. A fresh brief exists: nobody should regenerate.
await reset({
  text: `INSERT INTO "SessionBriefCache"
           (id, session, "briefDate", status, brief, "generatedAt", "claimedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1::"TradingSession", $2, 'READY', '{}'::jsonb, now(), now(), now(), now())`,
  values: [SESSION, DATE],
});
allOk &= report(
  "fresh brief cached",
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => claim(i))),
  0,
);

// 3. The stored brief has aged past the TTL: exactly one refreshes it.
await reset({
  text: `INSERT INTO "SessionBriefCache"
           (id, session, "briefDate", status, brief, "generatedAt", "claimedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1::"TradingSession", $2, 'READY', '{}'::jsonb,
                 now() - interval '5 hours', now() - interval '5 hours', now(), now())`,
  values: [SESSION, DATE],
});
allOk &= report(
  "stale brief",
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => claim(i))),
  1,
);

// 4. A generator crashed and left the row PENDING: exactly one takes over.
await reset({
  text: `INSERT INTO "SessionBriefCache"
           (id, session, "briefDate", status, "claimedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1::"TradingSession", $2, 'PENDING',
                 now() - interval '10 minutes', now(), now())`,
  values: [SESSION, DATE],
});
allOk &= report(
  "abandoned claim",
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => claim(i))),
  1,
);

// 5. A generator is mid-flight: nobody may take it over.
await reset({
  text: `INSERT INTO "SessionBriefCache"
           (id, session, "briefDate", status, "claimedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1::"TradingSession", $2, 'PENDING', now(), now(), now())`,
  values: [SESSION, DATE],
});
allOk &= report(
  "claim in flight",
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => claim(i))),
  0,
);

await reset(null);
console.log(allOk ? "\nall checks passed" : "\nSOME CHECKS FAILED");
process.exit(allOk ? 0 : 1);
