import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { withDb } from "@/lib/db";

// Get user statistics (Admin only or own stats)
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(params.id);

    // Allow users to view their own stats or admins to view any stats
    if (session.user.role !== "ADMIN" && parseInt(session.user.id) !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return await withDb(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          dataRequests: true,
          investor: {
            include: {
              assignedExports: true,
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const stats = {
        totalDataRequests: user.dataRequests.length,
        accountAge: Math.floor(
          (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
        ),
        lastLogin: user.updatedAt, // This would be better tracked with actual login timestamps
      };

      if (user.investor) {
        stats.assignedExports = user.investor.assignedExports.length;
        stats.totalInvestment = user.investor.amountInvested;
      }

      return NextResponse.json(stats);
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}
