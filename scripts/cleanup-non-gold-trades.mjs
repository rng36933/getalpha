// One-off cleanup, requested 2026-08-23: the journal accumulated trades from
// earlier multi-instrument bot testing before the product settled on
// XAUUSD-only, and a handful of setup labels from bots that no longer exist.
// This deletes the non-gold trades outright and blanks the setup field on
// trades tagged with a retired bot name (the trades themselves are real and
// stay). Backs up everything it touches to CSV first.
//
// Run with: node scripts/cleanup-non-gold-trades.mjs
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Client } from "pg";

const URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!URL) throw new Error("No database URL is set");

const RETIRED_SETUPS = [
  "ZonuRetestas",
  "KylamIrLeidziames",
  "SMC-bot 0cf7422fad4eb8d8",
  "SMC-bot 25209d3b8994214f",
  "SMC-bot 28cd46a3e9698d26",
  "SMC-bot bd7101596d1530e8",
  "SMC-bot 0b02459df629322b",
  "SMC-bot d9a6808360f61df3",
  "SMC-bot 76ba6ee6962658d1",
];

function toCsv(rows) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

const client = new Client({ connectionString: URL });
await client.connect();

const stamp = new Date().toISOString().replace(/[:.]/g, "-");

// --- Backup + delete non-gold trades ---
const toDelete = await client.query(`select * from "Trade" where asset <> 'XAUUSD'`);
console.log(`Non-gold trades to delete: ${toDelete.rows.length}`);
writeFileSync(`scripts/backup-deleted-trades-${stamp}.csv`, toCsv(toDelete.rows));

const deleteResult = await client.query(`delete from "Trade" where asset <> 'XAUUSD'`);
console.log(`Deleted: ${deleteResult.rowCount}`);

// --- Backup + blank setup on retired-bot trades ---
const toClear = await client.query(
  `select * from "Trade" where setup = any($1::text[])`,
  [RETIRED_SETUPS],
);
console.log(`\nTrades with a retired setup label: ${toClear.rows.length}`);
writeFileSync(`scripts/backup-cleared-setup-trades-${stamp}.csv`, toCsv(toClear.rows));

const clearResult = await client.query(
  `update "Trade" set setup = null where setup = any($1::text[])`,
  [RETIRED_SETUPS],
);
console.log(`Setup cleared on: ${clearResult.rowCount}`);

await client.end();
console.log("\nDone.");
