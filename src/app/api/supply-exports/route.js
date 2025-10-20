import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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

// Create a new supply-export mapping
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data = await request.json();
  const { supplyId, exportId, quantityBags } = data;

  try {
    // Validate supply and export exist
    const [supply, exportShipment] = await Promise.all([
      prisma.coalSupply.findUnique({ where: { id: parseInt(supplyId) } }),
      prisma.exportShipment.findUnique({ where: { id: parseInt(exportId) } }),
    ]);

    if (!supply || !exportShipment) {
      return NextResponse.json(
        { error: "Supply or Export not found" },
        { status: 404 }
      );
    }

    // Validate available quantity
    const usedQuantity = await prisma.supplyExport.aggregate({
      where: { supplyId: parseInt(supplyId) },
      _sum: { quantityBags: true },
    });

    const availableQuantity =
      supply.quantityBags - (usedQuantity._sum.quantityBags || 0);

    if (quantityBags > availableQuantity) {
      return NextResponse.json(
        {
          error: `Requested quantity (${quantityBags}) exceeds available supply (${availableQuantity})`,
        },
        { status: 400 }
      );
    }

    const supplyExport = await prisma.supplyExport.create({
      data: {
        supplyId: parseInt(supplyId),
        exportId: parseInt(exportId),
        quantityBags: parseInt(quantityBags),
      },
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
    });

    return NextResponse.json(supplyExport, { status: 201 });
  } catch (error) {
    console.error("Error creating supply-export:", error);
    return NextResponse.json(
      { error: "Failed to create supply-export" },
      { status: 500 }
    );
  }
}
