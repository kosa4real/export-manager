import { NextResponse } from "next/server";
import { testDbConnection } from "@/lib/db";

export async function GET() {
  try {
    const isConnected = await testDbConnection();

    if (isConnected) {
      return NextResponse.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
