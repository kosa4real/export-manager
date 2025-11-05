import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { withDb } from "@/lib/db";
import { SupplyExportValidator } from "@/lib/supply-export-validation";

// Bulk create supply-export mappings
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { allocations, validateFirst = true } = await request.json();

    console.log("Bulk allocation request:", { allocations, validateFirst });

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "Invalid allocations array" },
        { status: 400 }
      );
    }

    // Validate all allocations first if requested
    if (validateFirst) {
      console.log("Starting validation...");
      try {
        const validation = await SupplyExportValidator.validateBulkAllocation(
          allocations
        );
        console.log("Validation result:", validation);

        if (!validation.valid) {
          return NextResponse.json(
            {
              error: "Validation failed",
              validation,
              message: `${validation.summary.invalid} of ${validation.summary.total} allocations have errors`,
            },
            { status: 400 }
          );
        }
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return NextResponse.json(
          {
            error: "Validation process failed",
            details: validationError.message,
          },
          { status: 500 }
        );
      }
    }

    // Create all allocations in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdAllocations = [];
      const errors = [];

      for (const allocation of allocations) {
        try {
          const created = await tx.supplyExport.create({
            data: {
              supplyId: parseInt(allocation.supplyId),
              exportId: parseInt(allocation.exportId),
              quantityBags: parseInt(allocation.quantityBags),
              notes: allocation.notes || null,
              priority: allocation.priority ? parseInt(allocation.priority) : 0,
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
          createdAllocations.push(created);
        } catch (error) {
          errors.push({
            allocation,
            error: error.message,
          });
        }
      }

      if (errors.length > 0 && createdAllocations.length === 0) {
        throw new Error(
          `All allocations failed: ${errors.map((e) => e.error).join(", ")}`
        );
      }

      return { createdAllocations, errors };
    });

    const success = results.errors.length === 0;
    const message = success
      ? `Successfully created ${results.createdAllocations.length} allocations`
      : `Created ${results.createdAllocations.length} allocations with ${results.errors.length} errors`;

    return NextResponse.json(
      {
        success,
        allocations: results.createdAllocations,
        errors: results.errors,
        summary: {
          total: allocations.length,
          created: results.createdAllocations.length,
          failed: results.errors.length,
          totalQuantity: results.createdAllocations.reduce(
            (sum, alloc) => sum + alloc.quantityBags,
            0
          ),
        },
        message,
      },
      { status: success ? 201 : 207 }
    ); // 207 = Multi-Status
  } catch (error) {
    console.error("Bulk allocation error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Failed to create bulk allocations",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
