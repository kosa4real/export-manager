import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";

export async function GET() {
  try {
    return await withDb(async (prisma) => {
      const userCount = await prisma.user.count();
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
        },
        take: 5,
      });

      return NextResponse.json({
        userCount,
        users,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error("Test users failed:", error);
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
