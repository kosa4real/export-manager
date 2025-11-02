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

  const isInvestor = session.user.role === "INVESTOR";

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build where clause for investor filtering
    let whereClause = {};
    if (isInvestor) {
      const investor = await prisma.investor.findFirst({
        where: { user: { id: parseInt(session.user.id) } },
        select: { id: true },
      });

      if (!investor) {
        return NextResponse.json({
          totalExports: 0,
          exportsLast30Days: 0,
          totalQuantityBags: 0,
          pendingExports: 0,
          inTransitExports: 0,
          deliveredExports: 0,
          totalAmountReceived: 0,
          totalClearingFee: 0,
          totalNetProfit: 0,
        });
      }

      whereClause.assignedInvestorId = investor.id;
    }

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
      prisma.exportShipment.count({ where: whereClause }),

      // Exports in last 30 days
      prisma.exportShipment.count({
        where: {
          ...whereClause,
          exportDate: { gte: thirtyDaysAgo },
        },
      }),

      // Total quantity (sum of quantityBags)
      prisma.exportShipment
        .aggregate({
          where: whereClause,
          _sum: { quantityBags: true },
        })
        .then((res) => res._sum.quantityBags || 0),

      // Status counts
      prisma.exportShipment.count({
        where: { ...whereClause, status: "PENDING" },
      }),
      prisma.exportShipment.count({
        where: { ...whereClause, status: "IN_TRANSIT" },
      }),
      prisma.exportShipment.count({
        where: { ...whereClause, status: "DELIVERED" },
      }),

      // Financial aggregates (only for non-null values)
      prisma.exportShipment
        .aggregate({
          where: whereClause,
          _sum: { amountReceived: true },
        })
        .then((res) => res._sum.amountReceived || 0),

      prisma.exportShipment
        .aggregate({
          where: whereClause,
          _sum: { clearingFee: true },
        })
        .then((res) => res._sum.clearingFee || 0),

      prisma.exportShipment
        .aggregate({
          where: whereClause,
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
