import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasConfigured?: boolean;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Enable SQLite concurrency and safety optimizations (WAL mode, busy timeout, foreign keys)
  if (!globalForPrisma.sqlitePragmasConfigured) {
    globalForPrisma.sqlitePragmasConfigured = true;
    client.$queryRawUnsafe("PRAGMA journal_mode = WAL;")
      .then(() => client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;"))
      .then(() => client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;"))
      .then(() => client.$queryRawUnsafe("PRAGMA foreign_keys = ON;"))
      .catch((err) => {
        // Silently catch during build/static phases if db is not yet reachable
        if (process.env.NODE_ENV === "development") {
          console.warn("Notice: SQLite PRAGMA initialization info:", err?.message || err);
        }
      });
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
