// lib/db.js
import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client
// This prevents multiple instances in development due to hot reloading
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Wrapper function for database operations with automatic error handling
 * @param {Function} operation - Async function that receives prisma client
 * @returns {Promise} Result of the operation
 */
export async function withDb(operation) {
  try {
    const result = await operation(prisma);
    return result;
  } catch (error) {
    console.error("Database operation failed:", error);
    throw error;
  }
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export async function testDbConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

/**
 * Gracefully disconnect Prisma (useful for serverless cleanup)
 */
export async function disconnectDb() {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting database:", error);
  }
}

export default prisma;
