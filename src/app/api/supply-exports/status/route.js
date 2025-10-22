import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { SupplyExportValidator } from "@/lib/supply-export-validation";

// Get supply or export status
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const supplyId = searchParams.get("supplyId");
    const exportId = searchParams.get("exportId");

    if (!supplyId && !exportId) {
      return NextResponse.json(
        { error: "Must provide either supplyId or exportId" },
        { status: 400 }
      );
    }

    let status = null;

    if (supplyId) {
      status = await SupplyExportValidator.getSupplyStatus(supplyId);
      if (!status) {
        return NextResponse.json(
          { error: `Supply #${supplyId} not found` },
          { status: 404 }
        );
      }
    }

    if (exportId) {
      status = await SupplyExportValidator.getExportStatus(exportId);
      if (!status) {
        return NextResponse.json(
          { error: `Export #${exportId} not found` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      status,
      message: supplyId
        ? `Supply #${supplyId} is ${status.status.toLowerCase()}`
        : `Export #${exportId} is ${status.status.toLowerCase()}`,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
