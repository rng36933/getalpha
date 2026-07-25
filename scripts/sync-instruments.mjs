// Populates the Instrument catalogue from Twelve Data.
//
// Run with: node scripts/sync-instruments.mjs
// Needs TWELVE_DATA_API_KEY and DIRECT_URL (or DATABASE_URL).
//
// Run it once at setup and again when the provider adds instruments — the
// catalogue is static enough that fetching it per search would be waste.
import "dotenv/config";
import { Client } from "pg";

const KEY = process.env.TWELVE_DATA_API_KEY;
const URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!KEY) throw new Error("TWELVE_DATA_API_KEY is not set");
if (!URL) throw new Error("No database URL is set");

/** Instruments a trading desk reaches for first, ranked above the long tail. */
const POPULAR = new Map([
  ["XAU/USD", 100], ["XAG/USD", 90],
  ["EUR/USD", 95], ["GBP/USD", 94], ["USD/JPY", 93], ["AUD/USD", 92],
  ["USD/CHF", 91], ["USD/CAD", 90], ["NZD/USD", 89],
  ["EUR/GBP", 80], ["EUR/JPY", 80], ["GBP/JPY", 80],
  ["BTC/USD", 95], ["ETH/USD", 94], ["SOL/USD", 85], ["XRP/USD", 84],
]);

async function get(endpoint) {
  const res = await fetch(`https://api.twelvedata.com/${endpoint}?apikey=${KEY}`);
  if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body.data)) throw new Error(`${endpoint}: unexpected shape`);
  return body.data;
}

const rows = [];

for (const p of await get("forex_pairs")) {
  if (!p.symbol) continue;
  rows.push({
    symbol: p.symbol,
    label: p.symbol.replace("/", ""),
    name: `${p.currency_base} / ${p.currency_quote}`,
    kind: "FOREX",
    group: p.currency_group ?? null,
  });
}

for (const c of await get("cryptocurrencies")) {
  if (!c.symbol) continue;
  rows.push({
    symbol: c.symbol,
    label: c.symbol.replace("/", ""),
    name: `${c.currency_base} / ${c.currency_quote}`,
    kind: "CRYPTO",
    group: c.available_exchanges?.[0] ?? null,
  });
}

for (const c of await get("commodities")) {
  if (!c.symbol) continue;
  rows.push({
    symbol: c.symbol,
    label: c.symbol.replace("/", ""),
    name: c.name ?? c.symbol,
    kind: "COMMODITY",
    group: c.category ?? null,
  });
}

// The provider lists some symbols under more than one endpoint; last wins.
const unique = new Map(rows.map((r) => [r.symbol, r]));
console.log(`fetched ${rows.length} rows, ${unique.size} unique symbols`);

const client = new Client({ connectionString: URL });
await client.connect();

let written = 0;
for (const r of unique.values()) {
  await client.query(
    `INSERT INTO "Instrument" (symbol, label, name, kind, "group", popularity, "updatedAt")
     VALUES ($1, $2, $3, $4::"InstrumentKind", $5, $6, now())
     ON CONFLICT (symbol) DO UPDATE
       SET label = EXCLUDED.label, name = EXCLUDED.name, kind = EXCLUDED.kind,
           "group" = EXCLUDED."group", popularity = EXCLUDED.popularity,
           "updatedAt" = now()`,
    [r.symbol, r.label, r.name, r.kind, r.group, POPULAR.get(r.symbol) ?? 0],
  );
  written += 1;
}

const { rows: summary } = await client.query(
  `SELECT kind, count(*)::int AS n FROM "Instrument" GROUP BY kind ORDER BY kind`,
);
console.log(`wrote ${written} instruments`);
for (const s of summary) console.log(`  ${s.kind}: ${s.n}`);

await client.end();
