// app/api/suppliers/stats/route.js
import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await withDb(async (prisma) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, active, inactive, suspended, newLast30Days] =
        await Promise.all([
          prisma.coalSupplier.count(),
          prisma.coalSupplier.count({ where: { status: "ACTIVE" } }),
          prisma.coalSupplier.count({ where: { status: "INACTIVE" } }),
          prisma.coalSupplier.count({ where: { status: "SUSPENDED" } }),
          prisma.coalSupplier.count({
            where: {
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
        ]);

      return NextResponse.json({
        total,
        active,
        inactive,
        suspended,
        newLast30Days,
      });
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
