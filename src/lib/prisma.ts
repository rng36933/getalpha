import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env locally, or to the project's Environment Variables when deploying.",
  );
}

// On Vercel every concurrent invocation is its own process with its own pool.
// A generous pool size multiplied by dozens of warm instances exhausts the
// database's connection limit, so serverless gets one connection per instance
// and relies on the provider's pooler (Neon -pooler host, Supabase port 6543)
// to multiplex. Locally there is a single process, so a normal pool is fine.
const isServerless = process.env.VERCEL === "1";

// Next.js hot-reloads modules in development, which would otherwise open a new
// connection pool on every save until Postgres refuses new connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: isServerless ? 10_000 : 30_000,
      connectionTimeoutMillis: 10_000,
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
