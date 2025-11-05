import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// POST /api/exports/assign - Assign export to investor
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const { exportId, investorId } = await request.json();

    if (!exportId || !investorId) {
      return NextResponse.json(
        { error: "Export ID and Investor ID are required" },
        { status: 400 }
      );
    }

    return await withDb(async (prisma) => {
      // Verify export exists
      const exportExists = await prisma.exportShipment.findUnique({
        where: { id: parseInt(exportId) },
      });

      if (!exportExists) {
        return NextResponse.json(
          { error: "Export not found" },
          { status: 404 }
        );
      }

      // Verify investor exists
      const investorExists = await prisma.investor.findUnique({
        where: { id: parseInt(investorId) },
      });

      if (!investorExists) {
        return NextResponse.json(
          { error: "Investor not found" },
          { status: 404 }
        );
      }

      // Update export with investor assignment
      const updatedExport = await prisma.exportShipment.update({
        where: { id: parseInt(exportId) },
        data: { assignedInvestorId: parseInt(investorId) },
        select: {
          id: true,
          exportDate: true,
          quantityBags: true,
          destinationCountry: true,
          destinationCity: true,
          status: true,
          assignedInvestorId: true,
          assignedInvestor: {
            select: {
              id: true,
              name: true,
              profitShare: true,
              containerEquivalent: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        export: updatedExport,
        message: `Export #${exportId} assigned to ${investorExists.name}`,
      });
    });
  } catch (error) {
    console.error("Error assigning export:", error);
    return NextResponse.json(
      { error: "Failed to assign export" },
      { status: 500 }
    );
  }
}

// DELETE /api/exports/assign - Remove investor assignment from export
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get("exportId");

    if (!exportId) {
      return NextResponse.json(
        { error: "Export ID is required" },
        { status: 400 }
      );
    }

    return await withDb(async (prisma) => {
      // Update export to remove investor assignment
      const updatedExport = await prisma.exportShipment.update({
        where: { id: parseInt(exportId) },
        data: { assignedInvestorId: null },
        select: {
          id: true,
          exportDate: true,
          quantityBags: true,
          destinationCountry: true,
          destinationCity: true,
          status: true,
          assignedInvestorId: true,
        },
      });

      return NextResponse.json({
        success: true,
        export: updatedExport,
        message: `Investor assignment removed from Export #${exportId}`,
      });
    });
  } catch (error) {
    console.error("Error removing assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
