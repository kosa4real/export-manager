import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
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
      // Find the investor record linked to this user
      const investor = await prisma.investor.findFirst({
        where: { user: { id: parseInt(session.user.id) } },
        select: {
          id: true,
          profitShare: true,
          containerEquivalent: true,
          amountInvested: true,
        },
      });

      if (!investor) {
        return NextResponse.json({
          exports: [],
          total: 0,
          message: "No investment record found. Please contact an admin.",
        });
      }

      // Get exports assigned to this investor
      const assignedExports = await prisma.exportShipment.findMany({
        where: { assignedInvestorId: investor.id },
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
          amountReceived: true,
          clearingFee: true,
          netProfit: true,
          containerNumber: true,
        },
      });

      // Calculate investor's profit share for each export
      const exportsWithProfitShare = assignedExports.map((exportItem) => {
        let investorProfit = 0;
        let profitPercentage = 0;

        if (exportItem.netProfit && investor.profitShare) {
          // Parse profit share (e.g., "50/50" -> 50%)
          const shareMatch = investor.profitShare.match(/(\d+)/);
          profitPercentage = shareMatch ? parseInt(shareMatch[1]) : 50;
          investorProfit = (exportItem.netProfit * profitPercentage) / 100;
        }

        return {
          ...exportItem,
          investorProfit,
          profitPercentage,
          containerEquivalent: investor.containerEquivalent,
        };
      });

      return NextResponse.json({
        assignedExports: exportsWithProfitShare,
        investor: {
          containerEquivalent: investor.containerEquivalent,
          profitShare: investor.profitShare,
          amountInvested: investor.amountInvested,
        },
        total: assignedExports.length,
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
        assignedInvestorId: true,
        assignedInvestor: {
          select: {
            id: true,
            name: true,
            profitShare: true,
          },
        },
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
