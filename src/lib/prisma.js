// src/lib/prisma.js
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
  });

  // Explicitly connect in production to catch connection errors early
  if (process.env.NODE_ENV === "production") {
    client.$connect().catch((e) => {
      console.error("Failed to connect to database:", e);
      throw e;
    });
  }

  return client;
};

// Use globalThis without TypeScript declare syntax
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

export { prisma };
export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}
