import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Get exports for investor view
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isInvestor = session.user.role === "INVESTOR";
  const isAdmin = session.user.role === "ADMIN";

  try {
    if (isInvestor) {
      // For investors, show all exports (they're funding the overall operation)
      const exports = await prisma.exportShipment.findMany({
        orderBy: { exportDate: "desc" },
        take: 50, // Limit to recent exports
        select: {
          id: true,
          exportDate: true,
          quantityBags: true,
          destinationCountry: true,
          destinationCity: true,
          status: true,
          departureDate: true,
          arrivalDate: true,
        },
      });

      return NextResponse.json({
        exports,
        total: exports.length,
      });
    }

    // For admin/staff, return all exports with full details
    const exports = await prisma.exportShipment.findMany({
      orderBy: { exportDate: "desc" },
      select: {
        id: true,
        exportDate: true,
        quantityBags: true,
        destinationCountry: true,
        destinationCity: true,
        status: true,
        departureDate: true,
        arrivalDate: true,
        ...(isAdmin && {
          amountReceived: true,
          clearingFee: true,
          netProfit: true,
          buyer: true,
          clearingAgent: true,
        }),
      },
    });

    return NextResponse.json({
      exports,
      total: exports.length,
    });
  } catch (error) {
    console.error("Error fetching investor exports:", error);
    return NextResponse.json(
      { error: "Failed to fetch exports" },
      { status: 500 }
    );
  }
}
