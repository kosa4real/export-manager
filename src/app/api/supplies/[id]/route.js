// app/api/supplies/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Use your singleton client
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Helper: Validate and parse ID
function parseId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid ID");
  }
  return parsed;
}

// Helper: build select fields based on user role
function buildSelectFields(isAdmin) {
  const baseFields = {
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
    return {
      ...baseFields,
      unitPrice: true,
      amountPaid: true,
      balanceAmount: true,
      paymentStatus: true,
    };
  }

  return baseFields;
}

// GET /api/supplies/[id] — Get a single supply
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseId(params.id);
    const isAdmin = session.user.role === "ADMIN";

    const supply = await prisma.coalSupply.findUnique({
      where: { id },
      select: buildSelectFields(isAdmin),
    });

    if (!supply) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    return NextResponse.json(supply);
  } catch (error) {
    console.error("GET supply error:", error);
    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supply ID" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch supply" },
      { status: 500 }
    );
  }
}

// PUT /api/supplies/[id] — Update a supply
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const id = parseId(params.id);

    // Check if supply exists
    const existing = await prisma.coalSupply.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    const data = await request.json();
    const isAdmin = session.user.role === "ADMIN";

    // Validate required fields and supplierId if provided
    if (data.supplierId != null) {
      const supplierId = parseInt(data.supplierId, 10);
      if (isNaN(supplierId)) {
        return NextResponse.json(
          { error: "Invalid supplier ID format" },
          { status: 400 }
        );
      }
      const supplierExists = await prisma.coalSupplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplierExists) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const updateData = {};

    // Non-admin updatable fields
    if (data.supplyDate != null)
      updateData.supplyDate = new Date(data.supplyDate);
    if (data.quantityBags != null)
      updateData.quantityBags = parseInt(data.quantityBags, 10);
    if (data.gradeA != null) updateData.gradeA = parseInt(data.gradeA, 10);
    if (data.gradeB != null) updateData.gradeB = parseInt(data.gradeB, 10);
    if (data.rejectedBags != null)
      updateData.rejectedBags = parseInt(data.rejectedBags, 10);
    if (data.dustBags != null)
      updateData.dustBags = parseInt(data.dustBags, 10);
    if (data.woodBags != null)
      updateData.woodBags = parseInt(data.woodBags, 10);
    if (data.notes != null) updateData.notes = data.notes;

    // Supplier ID
    if (data.supplierId != null) {
      updateData.supplierId = parseInt(data.supplierId, 10);
    }

    // Admin-only fields
    if (isAdmin) {
      if (data.unitPrice != null)
        updateData.unitPrice = parseFloat(data.unitPrice);
      if (data.amountPaid != null)
        updateData.amountPaid = parseFloat(data.amountPaid);
      if (data.balanceAmount != null)
        updateData.balanceAmount = parseFloat(data.balanceAmount);
      if (data.paymentStatus != null)
        updateData.paymentStatus = data.paymentStatus;
    }

    const updated = await prisma.coalSupply.update({
      where: { id },
      data: updateData,
      select: buildSelectFields(isAdmin),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT supply error:", error);

    // Handle Prisma foreign key constraint error
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid supplier ID – foreign key constraint failed" },
        { status: 400 }
      );
    }

    // Handle unique constraint error (e.g., duplicate supplier + date)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A supply with this supplier and date already exists" },
        { status: 409 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supply ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update supply" },
      { status: 500 }
    );
  }
}

// DELETE /api/supplies/[id] — Delete a supply
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const id = parseId(params.id);

    // Check existence first (optional but user-friendly)
    const existing = await prisma.coalSupply.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Supply not found" }, { status: 404 });
    }

    await prisma.coalSupply.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Supply deleted successfully" });
  } catch (error) {
    console.error("DELETE supply error:", error);

    // Handle foreign key constraint (e.g., supply has exports)
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete supply with existing exports" },
        { status: 400 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supply ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete supply" },
      { status: 500 }
    );
  }
}
