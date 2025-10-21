import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { SupplyAllocationEngine } from "@/lib/supply-allocation-engine";

// Auto-allocate supplies to an export
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const {
      exportId,
      strategy = "OPTIMAL",
      dryRun = false,
    } = await request.json();

    if (!exportId) {
      return NextResponse.json(
        { error: "Missing required field: exportId" },
        { status: 400 }
      );
    }

    const result = await SupplyAllocationEngine.autoAllocate(exportId, {
      strategy,
      dryRun,
    });

    const statusCode = result.success ? 201 : 400;
    const message = dryRun
      ? `Dry run completed: ${result.summary.totalAllocations} allocations would be created`
      : result.success
      ? `Successfully created ${result.summary.totalAllocations} allocations`
      : `Auto-allocation failed with ${result.errors.length} errors`;

    return NextResponse.json(
      {
        ...result,
        message,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("Auto-allocation error:", error);

    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to auto-allocate supplies" },
      { status: 500 }
    );
  }
}
