import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { SupplyAllocationEngine } from "@/lib/supply-allocation-engine";

// Get allocation suggestions for an export
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get("exportId");
    const strategy = searchParams.get("strategy") || "OPTIMAL";
    const maxSuggestions = parseInt(searchParams.get("maxSuggestions") || "10");
    const minQuality = searchParams.get("minQuality") || "ANY";

    if (!exportId) {
      return NextResponse.json(
        { error: "Missing required parameter: exportId" },
        { status: 400 }
      );
    }

    const suggestions = await SupplyAllocationEngine.suggestAllocations(
      exportId,
      { strategy, maxSuggestions, minQuality }
    );

    return NextResponse.json({
      suggestions,
      message: suggestions.fullySourced
        ? "Export is already fully sourced"
        : `Found ${suggestions.suggestions.length} allocation suggestions`,
    });
  } catch (error) {
    console.error("Suggestions error:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to generate allocation suggestions" },
      { status: 500 }
    );
  }
}
