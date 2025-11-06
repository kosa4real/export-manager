// app/api/supplies/route.js
import { NextResponse } from "next/server";
import { withDb, prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Get all supplies
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const skip = (page - 1) * limit;
  const supplierIdParam = searchParams.get("supplierId");
  const supplierId = supplierIdParam
    ? parseInt(supplierIdParam, 10)
    : undefined;
  const isAdmin = session.user.role === "ADMIN";

  try {
    return await withDb(async (prisma) => {
      const selectFields = {
        id: true,
        supplier: { select: { id: true, name: true } },
        supplyDate: true,
        quantityBags: true,
        gradeA: true,
        gradeB: true,
        rejectedBags: true,
        dustBags: true,
        woodBags: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      };

      if (isAdmin) {
        selectFields.unitPrice = true;
        selectFields.amountPaid = true;
        selectFields.balanceAmount = true;
        selectFields.paymentStatus = true;
      }

      const supplies = await prisma.coalSupply.findMany({
        where: supplierId ? { supplierId } : undefined,
        skip,
        take: limit,
        orderBy: { supplyDate: "desc" },
        select: selectFields,
      });

      const total = await prisma.coalSupply.count({
        where: supplierId ? { supplierId } : undefined,
      });

      return NextResponse.json({ supplies, total, page, limit });
    });
  } catch (error) {
    console.error("Error fetching supplies:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplies" },
      { status: 500 }
    );
  }
}

// Create a new supply
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const isAdmin = session.user.role === "ADMIN";

    // Basic validation
    if (!data.supplierId || !data.supplyDate || data.quantityBags == null) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: supplierId, supplyDate, quantityBags",
        },
        { status: 400 }
      );
    }

    return await withDb(async (prisma) => {
      // ✅ FIXED: Use coalSupplier (model name), not supplier
      const supplierExists = await prisma.coalSupplier.findUnique({
        where: { id: parseInt(data.supplierId, 10) },
      });

      if (!supplierExists) {
        return NextResponse.json(
          { error: "Invalid supplier ID" },
          { status: 400 }
        );
      }

      const supplyData = {
        supplierId: parseInt(data.supplierId, 10),
        supplyDate: new Date(data.supplyDate),
        quantityBags: parseInt(data.quantityBags, 10),
        gradeA: data.gradeA != null ? parseInt(data.gradeA, 10) : 0,
        gradeB: data.gradeB != null ? parseInt(data.gradeB, 10) : 0,
        rejectedBags:
          data.rejectedBags != null ? parseInt(data.rejectedBags, 10) : 0,
        dustBags: data.dustBags != null ? parseInt(data.dustBags, 10) : 0,
        woodBags: data.woodBags != null ? parseInt(data.woodBags, 10) : 0,
        notes: data.notes || null,
      };

      if (isAdmin) {
        supplyData.unitPrice =
          typeof data.unitPrice === "number" ? data.unitPrice : 0;
        supplyData.amountPaid =
          typeof data.amountPaid === "number" ? data.amountPaid : 0;
        supplyData.balanceAmount =
          typeof data.balanceAmount === "number" ? data.balanceAmount : 0;
        supplyData.paymentStatus = data.paymentStatus || "BALANCED";
      }

      const selectFields = {
        id: true,
        supplier: { select: { id: true, name: true } },
        supplyDate: true,
        quantityBags: true,
        gradeA: true,
        gradeB: true,
        rejectedBags: true,
        dustBags: true,
        woodBags: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      };

      if (isAdmin) {
        selectFields.unitPrice = true;
        selectFields.amountPaid = true;
        selectFields.balanceAmount = true;
        selectFields.paymentStatus = true;
      }

      const supply = await prisma.coalSupply.create({
        data: supplyData,
        select: selectFields,
      });

      return NextResponse.json(supply, { status: 201 });
    });
  } catch (error) {
    console.error("Error creating supply:", error);

    // Handle Prisma foreign key constraint error
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A supply with this supplier and date already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create supply" },
      { status: 500 }
    );
  }
}
