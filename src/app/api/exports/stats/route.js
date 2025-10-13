// app/api/exports/stats/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all required stats in parallel
    const [
      totalExports,
      exportsLast30Days,
      totalQuantityBags,
      pendingExports,
      inTransitExports,
      deliveredExports,
      totalAmountReceived,
      totalClearingFee,
      totalNetProfit,
    ] = await Promise.all([
      // Total exports count
      prisma.exportShipment.count(),

      // Exports in last 30 days
      prisma.exportShipment.count({
        where: {
          exportDate: { gte: thirtyDaysAgo },
        },
      }),

      // Total quantity (sum of quantityBags)
      prisma.exportShipment
        .aggregate({
          _sum: { quantityBags: true },
        })
        .then((res) => res._sum.quantityBags || 0),

      // Status counts
      prisma.exportShipment.count({ where: { status: "PENDING" } }),
      prisma.exportShipment.count({ where: { status: "IN_TRANSIT" } }),
      prisma.exportShipment.count({ where: { status: "DELIVERED" } }),

      // Financial aggregates (only for non-null values)
      prisma.exportShipment
        .aggregate({
          _sum: { amountReceived: true },
        })
        .then((res) => res._sum.amountReceived || 0),

      prisma.exportShipment
        .aggregate({
          _sum: { clearingFee: true },
        })
        .then((res) => res._sum.clearingFee || 0),

      prisma.exportShipment
        .aggregate({
          _sum: { netProfit: true },
        })
        .then((res) => res._sum.netProfit || 0),
    ]);

    return NextResponse.json({
      totalExports,
      exportsLast30Days,
      totalQuantityBags,
      pendingExports,
      inTransitExports,
      deliveredExports,
      totalAmountReceived: parseFloat(totalAmountReceived.toFixed(2)),
      totalClearingFee: parseFloat(totalClearingFee.toFixed(2)),
      totalNetProfit: parseFloat(totalNetProfit.toFixed(2)),
    });
  } catch (error) {
    console.error("Exports stats error:", error);
    return NextResponse.json(
      { error: "Failed to load export stats" },
      { status: 500 }
    );
  }
}
