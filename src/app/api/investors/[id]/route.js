import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
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

// Helper: build select fields based on user role
function buildSelectFields(isAdmin) {
  const baseFields = {
    id: true,
    name: true,
    contactInfo: true,
    email: true,
    investmentDate: true,
    currency: true,
    bankName: true,
    status: true,
    isActive: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
  };

  if (isAdmin) {
    return {
      ...baseFields,
      amountInvested: true,
      amountReceived: true,
      exchangeRate: true,
      profitShare: true,
      containerEquivalent: true,
    };
  }

  return baseFields;
}

// GET /api/investors/[id] — Get a single investor
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseId(params.id);
    const isAdmin = session.user.role === "ADMIN";
    const isInvestor = session.user.role === "INVESTOR";

    // If user is an investor, only allow access to their own record
    let whereClause = { id };
    if (isInvestor) {
      whereClause = {
        id,
        user: { id: parseInt(session.user.id) },
      };
    }

    return await withDb(async (prisma) => {
      const investor = await prisma.investor.findFirst({
        where: whereClause,
        select: buildSelectFields(isAdmin),
      });

      if (!investor) {
        return NextResponse.json(
          { error: "Investor not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(investor);
    });
  } catch (error) {
    console.error("GET investor error:", error);
    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid investor ID" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch investor" },
      { status: 500 }
    );
  }
}

// PUT /api/investors/[id] — Update an investor
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const id = parseId(params.id);

    // Check if investor exists
    const existing = await prisma.investor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Build update payload
    const updateData = {};

    // Basic fields
    if (data.name != null) updateData.name = data.name;
    if (data.contactInfo != null) updateData.contactInfo = data.contactInfo;
    if (data.email != null) updateData.email = data.email;
    if (data.investmentDate != null)
      updateData.investmentDate = new Date(data.investmentDate);
    if (data.currency != null) updateData.currency = data.currency;
    if (data.bankName != null) updateData.bankName = data.bankName;
    if (data.status != null) updateData.status = data.status;
    if (data.isActive != null) updateData.isActive = data.isActive;
    if (data.notes != null) updateData.notes = data.notes;

    // Financial fields
    if (data.amountInvested != null)
      updateData.amountInvested = parseFloat(data.amountInvested);
    if (data.amountReceived != null)
      updateData.amountReceived = parseFloat(data.amountReceived);
    if (data.exchangeRate != null)
      updateData.exchangeRate = parseFloat(data.exchangeRate);
    if (data.profitShare != null) updateData.profitShare = data.profitShare;
    if (data.containerEquivalent != null)
      updateData.containerEquivalent = parseFloat(data.containerEquivalent);

    // Handle user connection
    if (data.userId != null) {
      if (data.userId === "") {
        updateData.user = { disconnect: true };
      } else {
        updateData.user = { connect: { id: parseInt(data.userId) } };
      }
    }

    const updated = await prisma.investor.update({
      where: { id },
      data: updateData,
      select: buildSelectFields(true), // Admin gets full data
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT investor error:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "An investor with this name and investment date already exists",
        },
        { status: 409 }
      );
    }

    // Handle foreign key constraint error
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid user ID – foreign key constraint failed" },
        { status: 400 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid investor ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update investor" },
      { status: 500 }
    );
  }
}

// DELETE /api/investors/[id] — Delete an investor
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

    // Check existence first
    const existing = await prisma.investor.findUnique({
      where: { id },
      include: {
        user: true,
        dataRequests: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    // Check for related data that might prevent deletion
    if (existing.dataRequests && existing.dataRequests.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete investor with existing data requests" },
        { status: 400 }
      );
    }

    // Delete the investor
    await prisma.investor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Investor deleted successfully" });
  } catch (error) {
    console.error("DELETE investor error:", error);

    // Handle foreign key constraint (e.g., investor has related records)
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete investor with existing related records" },
        { status: 400 }
      );
    }

    if (error.message === "Invalid ID") {
      return NextResponse.json(
        { error: "Invalid investor ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete investor" },
      { status: 500 }
    );
  }
}
