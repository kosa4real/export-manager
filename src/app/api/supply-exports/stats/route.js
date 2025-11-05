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
      // Get total mappings count
      const totalMappings = await prisma.supplyExport.count();

      // Get total mapped quantity
      const mappedQuantityResult = await prisma.supplyExport.aggregate({
        _sum: {
          quantityBags: true,
        },
      });

      // Get recent mappings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mappingsLast30Days = await prisma.supplyExport.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Get mapping efficiency stats
      const totalSupplies = await prisma.coalSupply.count();
      const totalExports = await prisma.exportShipment.count();

      // Get supplies with mappings
      const suppliesWithMappings = await prisma.coalSupply.count({
        where: {
          exports: {
            some: {},
          },
        },
      });

      // Get exports with mappings
      const exportsWithMappings = await prisma.exportShipment.count({
        where: {
          supplies: {
            some: {},
          },
        },
      });

      // Calculate efficiency percentages
      const supplyMappingEfficiency =
        totalSupplies > 0
          ? Math.round((suppliesWithMappings / totalSupplies) * 100)
          : 0;

      const exportMappingEfficiency =
        totalExports > 0
          ? Math.round((exportsWithMappings / totalExports) * 100)
          : 0;

      // Get top destinations by mapped quantity
      const topDestinations = await prisma.supplyExport.groupBy({
        by: ["exportId"],
        _sum: {
          quantityBags: true,
        },
        orderBy: {
          _sum: {
            quantityBags: "desc",
          },
        },
        take: 5,
      });

      // Get destination details
      const destinationDetails = await Promise.all(
        topDestinations.map(async (item) => {
          const exportDetails = await prisma.exportShipment.findUnique({
            where: { id: item.exportId },
            select: {
              destinationCountry: true,
              destinationCity: true,
            },
          });
          return {
            destination: `${exportDetails?.destinationCountry}, ${exportDetails?.destinationCity}`,
            quantity: item._sum.quantityBags,
          };
        })
      );

      return NextResponse.json({
        totalMappings,
        totalMappedQuantity: mappedQuantityResult._sum.quantityBags || 0,
        mappingsLast30Days,
        supplyMappingEfficiency,
        exportMappingEfficiency,
        suppliesWithMappings,
        exportsWithMappings,
        totalSupplies,
        totalExports,
        topDestinations: destinationDetails,
      });
    });
  } catch (error) {
    console.error("Error fetching supply-export stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch supply-export statistics" },
      { status: 500 }
    );
  }
}
