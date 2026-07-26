import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Catches the deployment failures a build cannot.
 *
 * Vercel validates plan limits when it deploys, not when it builds. A
 * `maxDuration` above the plan's ceiling compiles perfectly, passes CI, and
 * then fails on the platform with nothing in the compiler output to explain
 * it — which is exactly what happened here: every deploy from the day the cron
 * route landed was rejected for `maxDuration = 300`, and local builds stayed
 * green throughout.
 *
 * Run in CI so the constraint fails where somebody is looking.
 *
 * Set DEPLOY_PLAN=pro if the account is upgraded; the ceiling moves to 300.
 */

const PLAN = process.env.DEPLOY_PLAN === "pro" ? "pro" : "hobby";

/** https://vercel.com/docs/functions/limitations */
const MAX_DURATION = PLAN === "pro" ? 300 : 60;

const problems = [];

/* -------------------------------------------------------------- maxDuration */

function* routeFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      yield* routeFiles(path);
    } else if (entry === "route.ts" || entry === "page.tsx") {
      yield path;
    }
  }
}

for (const file of routeFiles("src/app")) {
  const source = readFileSync(file, "utf8");
  const match = source.match(/export\s+const\s+maxDuration\s*=\s*(\d+)/);
  if (!match) continue;

  const value = Number(match[1]);

  if (value > MAX_DURATION) {
    problems.push(
      `${file}: maxDuration is ${value}, but the ${PLAN} plan allows at most ${MAX_DURATION}. ` +
        `Vercel rejects this when it deploys, not when it builds.`,
    );
  }
}

/* --------------------------------------------------------------- cron cadence */

let config;
try {
  config = JSON.parse(readFileSync("vercel.json", "utf8"));
} catch {
  config = null;
}

for (const cron of config?.crons ?? []) {
  const fields = String(cron.schedule ?? "").trim().split(/\s+/);

  if (fields.length !== 5) {
    problems.push(`vercel.json: "${cron.schedule}" is not a five-field cron expression.`);
    continue;
  }

  const [minute, hour] = fields;

  // Hobby runs a job at most once a day, and a more frequent expression fails
  // the deployment. Anything with a list, step or wildcard in the minute or
  // hour field fires more than daily.
  if (PLAN === "hobby" && (/[*/,-]/.test(minute) || /[*/,-]/.test(hour))) {
    problems.push(
      `vercel.json: "${cron.schedule}" runs more than once a day, which the hobby plan refuses at deploy time.`,
    );
  }
}

/* ------------------------------------------------------------------- report */

if (problems.length > 0) {
  console.error(`Deployment limits for the ${PLAN} plan are not met:\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

console.log(`Deployment limits look fine for the ${PLAN} plan.`);
