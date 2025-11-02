import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// GET /api/exports/[id] — Get single export shipment
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const isAdmin = session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR";

  // Validate ID
  const exportId = parseInt(id);
  if (isNaN(exportId) || exportId <= 0) {
    return NextResponse.json({ error: "Invalid export ID" }, { status: 400 });
  }

  try {
    let whereClause = { id: exportId };

    // If user is an investor, only allow access to exports assigned to them
    if (isInvestor) {
      const investor = await prisma.investor.findFirst({
        where: { user: { id: parseInt(session.user.id) } },
        select: { id: true },
      });

      if (!investor) {
        return NextResponse.json(
          { error: "No investment record found" },
          { status: 403 }
        );
      }

      whereClause.assignedInvestorId = investor.id;
    }

    const exportShipment = await prisma.exportShipment.findUnique({
      where: whereClause,
      select: {
        id: true,
        exportDate: true,
        quantityBags: true,
        departureDate: true,
        arrivalDate: true,
        destinationCountry: true,
        destinationCity: true,
        departureClearingAgent: true,
        departureClearingFee: true,
        arrivalClearingAgent: true,
        arrivalClearingFee: true,
        clearingAgent: true, // Keep for backward compatibility
        buyer: true,
        containerNumber: true,
        status: true,
        notes: true,
        assignedInvestorId: true,
        createdAt: true,
        updatedAt: true,
        ...(isAdmin && {
          amountReceived: true,
          clearingFee: true, // Keep for backward compatibility
          netProfit: true,
        }),
        // For investors, show financial data but calculate their share
        ...(isInvestor && {
          amountReceived: true,
          clearingFee: true, // Keep for backward compatibility
          netProfit: true,
          assignedInvestor: {
            select: {
              profitShare: true,
            },
          },
        }),
      },
    });

    if (!exportShipment) {
      return NextResponse.json(
        {
          error: isInvestor
            ? "Export not found or not assigned to you"
            : `Export shipment with ID ${exportId} not found`,
        },
        { status: 404 }
      );
    }

    // Calculate investor profit share for investor users
    if (
      isInvestor &&
      exportShipment.netProfit &&
      exportShipment.assignedInvestor?.profitShare
    ) {
      const shareMatch =
        exportShipment.assignedInvestor.profitShare.match(/(\d+)/);
      const sharePercentage = shareMatch ? parseInt(shareMatch[1]) : 50;
      exportShipment.investorProfit =
        (exportShipment.netProfit * sharePercentage) / 100;
    }

    return NextResponse.json(exportShipment);
  } catch (error) {
    console.error("Error fetching export:", error);
    return NextResponse.json(
      { error: "Failed to fetch export", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/exports/[id] — Update export shipment
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = params;
  const isAdmin = session.user.role === "ADMIN";

  try {
    const data = await request.json();

    // Check if export exists
    const existingExport = await prisma.exportShipment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingExport) {
      return NextResponse.json(
        { error: "Export shipment not found" },
        { status: 404 }
      );
    }

    const updateData = {};

    // Update basic fields
    if (data.exportDate !== undefined) {
      updateData.exportDate = new Date(data.exportDate);
    }
    if (data.quantityBags !== undefined) {
      updateData.quantityBags = parseInt(data.quantityBags);
    }
    if (data.departureDate !== undefined) {
      updateData.departureDate = new Date(data.departureDate);
    }
    if (data.arrivalDate !== undefined) {
      updateData.arrivalDate = data.arrivalDate
        ? new Date(data.arrivalDate)
        : null;
    }
    if (data.destinationCountry !== undefined) {
      updateData.destinationCountry = data.destinationCountry;
    }
    if (data.destinationCity !== undefined) {
      updateData.destinationCity = data.destinationCity;
    }
    if (data.departureClearingAgent !== undefined) {
      updateData.departureClearingAgent = data.departureClearingAgent || null;
    }
    if (data.departureClearingFee !== undefined) {
      updateData.departureClearingFee = data.departureClearingFee
        ? parseFloat(data.departureClearingFee)
        : null;
    }
    if (data.arrivalClearingAgent !== undefined) {
      updateData.arrivalClearingAgent = data.arrivalClearingAgent || null;
    }
    if (data.arrivalClearingFee !== undefined) {
      updateData.arrivalClearingFee = data.arrivalClearingFee
        ? parseFloat(data.arrivalClearingFee)
        : null;
    }
    if (data.buyer !== undefined) {
      updateData.buyer = data.buyer || null;
    }
    if (data.containerNumber !== undefined) {
      updateData.containerNumber = data.containerNumber || null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }

    // Admin-only fields
    if (isAdmin) {
      if (data.amountReceived !== undefined) {
        updateData.amountReceived = data.amountReceived
          ? parseFloat(data.amountReceived)
          : null;
      }
      if (data.netProfit !== undefined) {
        updateData.netProfit = data.netProfit
          ? parseFloat(data.netProfit)
          : null;
      }
    }

    const updatedExport = await prisma.exportShipment.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        exportDate: true,
        quantityBags: true,
        departureDate: true,
        arrivalDate: true,
        destinationCountry: true,
        destinationCity: true,
        departureClearingAgent: true,
        departureClearingFee: true,
        arrivalClearingAgent: true,
        arrivalClearingFee: true,
        clearingAgent: true, // Keep for backward compatibility
        buyer: true,
        containerNumber: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        ...(isAdmin && {
          amountReceived: true,
          clearingFee: true, // Keep for backward compatibility
          netProfit: true,
        }),
      },
    });

    return NextResponse.json(updatedExport);
  } catch (error) {
    console.error("Error updating export:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Container number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update export" },
      { status: 500 }
    );
  }
}

// DELETE /api/exports/[id] — Delete export shipment
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = params;

  try {
    // Check if export exists
    const existingExport = await prisma.exportShipment.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplies: true,
      },
    });

    if (!existingExport) {
      return NextResponse.json(
        { error: "Export shipment not found" },
        { status: 404 }
      );
    }

    // Delete related supply exports first, then the export shipment
    await prisma.$transaction([
      prisma.supplyExport.deleteMany({
        where: { exportId: parseInt(id) },
      }),
      prisma.exportShipment.delete({
        where: { id: parseInt(id) },
      }),
    ]);

    return NextResponse.json({
      message: "Export shipment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting export:", error);
    return NextResponse.json(
      { error: "Failed to delete export" },
      { status: 500 }
    );
  }
}
