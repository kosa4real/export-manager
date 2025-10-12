// app/api/suppliers/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Use your singleton client
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Get all suppliers
export async function GET(request) {
  // Authenticate user first
  // Only authenticated users can fetch suppliers
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const status = searchParams.get("status");

  try {
    const suppliers = await prisma.coalSupplier.findMany({
      where: status ? { status } : undefined,
      skip,
      take: limit,
      orderBy: { name: "asc" },
    });

    // Optional: Also return total count for pagination
    const total = await prisma.coalSupplier.count({
      where: status ? { status } : undefined,
    });

    return NextResponse.json({ suppliers, total, page, limit });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// Create a new supplier
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const data = await request.json();

    // Basic validation
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supplier = await prisma.coalSupplier.create({
      data: {
        name: data.name.trim(),
        contactInfo: data.contactInfo?.trim() || null,
        email: data.email?.trim() || null,
        fullAddress: data.fullAddress?.trim() || null,
        status: data.status || "ACTIVE",
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);

    // Handle Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A supplier with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
