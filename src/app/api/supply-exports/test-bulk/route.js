import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// Simple test endpoint for bulk allocation
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    console.log("Test bulk endpoint called");

    const { allocations } = await request.json();
    console.log("Received allocations:", allocations);

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "Invalid allocations array" },
        { status: 400 }
      );
    }

    // Test database connection
    const testCount = await prisma.supplyExport.count();
    console.log("Current supply-export count:", testCount);

    // Try to create one allocation without validation
    const firstAllocation = allocations[0];
    console.log("Attempting to create:", firstAllocation);

    const created = await prisma.supplyExport.create({
      data: {
        supplyId: parseInt(firstAllocation.supplyId),
        exportId: parseInt(firstAllocation.exportId),
        quantityBags: parseInt(firstAllocation.quantityBags),
        notes: firstAllocation.notes || "Test allocation",
        priority: 0,
      },
      include: {
        supply: {
          select: {
            id: true,
            supplier: { select: { name: true } },
          },
        },
        export: {
          select: {
            id: true,
            destinationCity: true,
            destinationCountry: true,
          },
        },
      },
    });

    console.log("Successfully created:", created);

    return NextResponse.json({
      success: true,
      message: "Test allocation created successfully",
      allocation: created,
    });
  } catch (error) {
    console.error("Test bulk allocation error:", error);
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    return NextResponse.json(
      {
        error: "Test failed",
        message: error.message,
        code: error.code,
        meta: error.meta,
      },
      { status: 500 }
    );
  }
}
