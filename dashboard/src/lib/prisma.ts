import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma";
import "dotenv/config";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = `${process.env.DATABASE_URL}?connection_limit=5`;
const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
