import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      session,
      authenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      {
        error: "Failed to get session",
        details: error.message,
        authenticated: false,
      },
      { status: 500 }
    );
  }
}
