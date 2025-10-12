// app/api/supplies/stats/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Base stats available to all users
    const baseStats = await Promise.all([
      // Total supplies count
      prisma.coalSupply.count(),

      // Supplies in last 30 days
      prisma.coalSupply.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Supplies in last 7 days
      prisma.coalSupply.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Total quantity of bags
      prisma.coalSupply.aggregate({
        _sum: {
          quantityBags: true,
        },
      }),

      // Total grade A bags
      prisma.coalSupply.aggregate({
        _sum: {
          gradeA: true,
        },
      }),

      // Total grade B bags
      prisma.coalSupply.aggregate({
        _sum: {
          gradeB: true,
        },
      }),

      // Total rejected bags
      prisma.coalSupply.aggregate({
        _sum: {
          rejectedBags: true,
        },
      }),
    ]);

    const [
      totalSupplies,
      suppliesLast30Days,
      suppliesLast7Days,
      totalBags,
      totalGradeA,
      totalGradeB,
      totalRejected,
    ] = baseStats;

    const stats = {
      totalSupplies,
      suppliesLast30Days,
      suppliesLast7Days,
      totalQuantityBags: totalBags._sum.quantityBags || 0,
      totalGradeA: totalGradeA._sum.gradeA || 0,
      totalGradeB: totalGradeB._sum.gradeB || 0,
      totalRejected: totalRejected._sum.rejectedBags || 0,
    };

    // Add financial stats only for admin users
    if (isAdmin) {
      const financialStats = await Promise.all([
        // Total amount paid
        prisma.coalSupply.aggregate({
          _sum: {
            amountPaid: true,
          },
        }),

        // Total balance amount
        prisma.coalSupply.aggregate({
          _sum: {
            balanceAmount: true,
          },
        }),

        // Count by payment status
        prisma.coalSupply.count({
          where: { paymentStatus: "BALANCED" },
        }),

        prisma.coalSupply.count({
          where: { paymentStatus: "OVERPAID" },
        }),

        prisma.coalSupply.count({
          where: { paymentStatus: "UNDERPAID" },
        }),
      ]);

      const [
        totalPaid,
        totalBalance,
        balancedCount,
        overpaidCount,
        underpaidCount,
      ] = financialStats;

      stats.totalAmountPaid = totalPaid._sum.amountPaid || 0;
      stats.totalBalanceAmount = totalBalance._sum.balanceAmount || 0;
      stats.balancedSupplies = balancedCount;
      stats.overpaidSupplies = overpaidCount;
      stats.underpaidSupplies = underpaidCount;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Supplies stats error:", error);
    return NextResponse.json(
      { error: "Failed to load supplies statistics" },
      { status: 500 }
    );
  }
}
