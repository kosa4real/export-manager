import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  let prisma;
  try {
    console.log("Creating Prisma client...");
    prisma = new PrismaClient({
      log: ["error", "warn"],
    });

    console.log("Testing database connection...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Database query result:", result);

    return NextResponse.json({
      status: "success",
      result: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
