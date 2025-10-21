import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { SupplyExportValidator } from "@/lib/supply-export-validation";
import { SupplyAllocationEngine } from "@/lib/supply-allocation-engine";

// Get all supply-export mappings
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const supplyId = searchParams.get("supplyId");
  const exportId = searchParams.get("exportId");

  try {
    const where = {
      ...(supplyId ? { supplyId: parseInt(supplyId) } : {}),
      ...(exportId ? { exportId: parseInt(exportId) } : {}),
    };

    const [supplyExports, total] = await Promise.all([
      prisma.supplyExport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supply: {
            select: {
              id: true,
              supplyDate: true,
              supplier: { select: { name: true } },
            },
          },
          export: {
            select: {
              id: true,
              exportDate: true,
              destinationCountry: true,
              destinationCity: true,
              status: true,
            },
          },
        },
      }),
      prisma.supplyExport.count({ where }),
    ]);

    return NextResponse.json({
      supplyExports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching supply-exports:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply-exports" },
      { status: 500 }
    );
  }
}

// Create a new supply-export mapping with enhanced validation
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { supplyId, exportId, quantityBags, notes, priority } = data;

    // Validate required fields
    if (!supplyId || !exportId || !quantityBags) {
      return NextResponse.json(
        { error: "Missing required fields: supplyId, exportId, quantityBags" },
        { status: 400 }
      );
    }

    // Use enhanced validation
    const validation = await SupplyExportValidator.validateMapping(
      supplyId,
      exportId,
      parseInt(quantityBags)
    );

    // Create the mapping
    const supplyExport = await prisma.supplyExport.create({
      data: {
        supplyId: parseInt(supplyId),
        exportId: parseInt(exportId),
        quantityBags: parseInt(quantityBags),
        notes: notes || null,
        priority: priority ? parseInt(priority) : 0,
      },
      include: {
        supply: {
          select: {
            id: true,
            supplyDate: true,
            quantityBags: true,
            gradeA: true,
            gradeB: true,
            supplier: { select: { name: true } },
          },
        },
        export: {
          select: {
            id: true,
            exportDate: true,
            quantityBags: true,
            destinationCountry: true,
            destinationCity: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        supplyExport,
        validation,
        message: "Supply-export mapping created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating supply-export:", error);

    // Return validation errors with proper status codes
    if (error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error.message.includes("available") ||
      error.message.includes("needs")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to create supply-export mapping" },
      { status: 500 }
    );
  }
}
