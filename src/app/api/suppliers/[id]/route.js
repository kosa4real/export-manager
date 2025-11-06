import { NextResponse } from "next/server";
import { withDb } from "@/lib/db"; // ✅ Use your singleton client
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Helper: Validate and parse ID
function parseId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error("Invalid ID");
  }
  return parsed;
}

// GET /api/suppliers/[id] — Get a single supplier
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: idParam } = await params; // ✅ Await params first
    const id = parseId(idParam);

    const supplier = await prisma.coalSupplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("GET supplier error:", error);
    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] — Update a supplier
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { id: idParam } = await params; // ✅ Await params first
    const id = parseId(idParam);
    const data = await request.json();

    // Validate required field
    if (!data.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if supplier exists
    const existing = await prisma.coalSupplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.coalSupplier.update({
      where: { id },
      data: {
        name: data.name.trim(),
        contactInfo: data.contactInfo?.trim() || null,
        email: data.email?.trim() || null,
        fullAddress: data.fullAddress?.trim() || null,
        status: data.status || existing.status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT supplier error:", error);

    // Handle Prisma unique constraint error (e.g., duplicate name)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A supplier with this name already exists" },
        { status: 409 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] — Delete a supplier
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const { id: idParam } = await params; // ✅ Await params first
    const id = parseId(idParam);

    // Check existence first (optional but user-friendly)
    const existing = await prisma.coalSupplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    await prisma.coalSupplier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error("DELETE supplier error:", error);

    // Handle foreign key constraint (e.g., supplier has supplies)
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete supplier with existing supplies" },
        { status: 400 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
