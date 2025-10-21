import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { SupplyExportValidator } from "@/lib/supply-export-validation";

// Validate a supply-export mapping without creating it
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const supplyId = searchParams.get("supplyId");
    const exportId = searchParams.get("exportId");
    const quantityBags = searchParams.get("quantityBags");

    if (!supplyId || !exportId || !quantityBags) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: supplyId, exportId, quantityBags",
        },
        { status: 400 }
      );
    }

    const validation = await SupplyExportValidator.validateMapping(
      supplyId,
      exportId,
      parseInt(quantityBags)
    );

    return NextResponse.json({
      valid: true,
      validation,
      message: "Mapping is valid and can be created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: error.message,
        message: "Mapping validation failed",
      },
      { status: 400 }
    );
  }
}

// Validate bulk allocations
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { allocations } = await request.json();

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "Invalid allocations array" },
        { status: 400 }
      );
    }

    const validation = await SupplyExportValidator.validateBulkAllocation(
      allocations
    );

    return NextResponse.json({
      validation,
      message: validation.valid
        ? "All allocations are valid"
        : `${validation.summary.invalid} of ${validation.summary.total} allocations have errors`,
    });
  } catch (error) {
    console.error("Bulk validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate bulk allocations" },
      { status: 500 }
    );
  }
}
