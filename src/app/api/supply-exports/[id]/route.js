import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Get a supply-export mapping by composite ID
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse composite ID (format: "supplyId-exportId")
    const [supplyId, exportId] = params.id.split("-").map(Number);

    const supplyExport = await prisma.supplyExport.findUnique({
      where: {
        supplyId_exportId: {
          supplyId,
          exportId,
        },
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

    if (!supplyExport) {
      return NextResponse.json(
        { error: "Supply-Export not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplyExport);
  } catch (error) {
    console.error("Error fetching supply-export:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply-export" },
      { status: 500 }
    );
  }
}

// Update a supply-export mapping
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data = await request.json();
  const { supplyId, exportId, quantityBags } = data;

  try {
    // Parse current composite ID
    const [currentSupplyId, currentExportId] = params.id.split("-").map(Number);

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

    // Validate available quantity (excluding current record)
    const usedQuantity = await prisma.supplyExport.aggregate({
      where: {
        supplyId: parseInt(supplyId),
        NOT: {
          supplyId_exportId: {
            supplyId: currentSupplyId,
            exportId: currentExportId,
          },
        },
      },
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

    // Delete old record and create new one (since primary key might change)
    await prisma.$transaction(async (tx) => {
      await tx.supplyExport.delete({
        where: {
          supplyId_exportId: {
            supplyId: currentSupplyId,
            exportId: currentExportId,
          },
        },
      });

      await tx.supplyExport.create({
        data: {
          supplyId: parseInt(supplyId),
          exportId: parseInt(exportId),
          quantityBags: parseInt(quantityBags),
        },
      });
    });

    // Fetch the updated record
    const supplyExport = await prisma.supplyExport.findUnique({
      where: {
        supplyId_exportId: {
          supplyId: parseInt(supplyId),
          exportId: parseInt(exportId),
        },
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

    return NextResponse.json(supplyExport);
  } catch (error) {
    console.error("Error updating supply-export:", error);
    return NextResponse.json(
      { error: "Failed to update supply-export" },
      { status: 500 }
    );
  }
}

// Delete a supply-export mapping
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    // Parse composite ID
    const [supplyId, exportId] = params.id.split("-").map(Number);

    await prisma.supplyExport.delete({
      where: {
        supplyId_exportId: {
          supplyId,
          exportId,
        },
      },
    });

    return NextResponse.json({ message: "Supply-Export deleted" });
  } catch (error) {
    console.error("Error deleting supply-export:", error);
    return NextResponse.json(
      { error: "Failed to delete supply-export" },
      { status: 500 }
    );
  }
}
