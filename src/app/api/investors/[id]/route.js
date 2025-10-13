import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Get an investor by ID
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const isAdmin = session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR";

  try {
    const investor = await prisma.investor.findUnique({
      where: { id: parseInt(id) },
      select: {
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
        ...(isAdmin && {
          amountInvested: true,
          amountReceived: true,
          exchangeRate: true,
          profitShare: true,
          containerEquivalent: true,
        }),
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!investor) {
      return NextResponse.json(
        { error: "Investor not found" },
        { status: 404 }
      );
    }

    // Check if investor user is trying to access someone else's record
    if (isInvestor && investor.user?.id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Access denied: Not your record" },
        { status: 403 }
      );
    }

    return NextResponse.json(investor);
  } catch (error) {
    console.error("Error fetching investor:", error);
    return NextResponse.json(
      { error: "Failed to fetch investor" },
      { status: 500 }
    );
  }
}

// Update an investor
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    const data = await request.json();

    const updateData = {};

    // Update basic fields
    if (data.name !== undefined) updateData.name = data.name;
    if (data.contactInfo !== undefined)
      updateData.contactInfo = data.contactInfo || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.investmentDate !== undefined)
      updateData.investmentDate = new Date(data.investmentDate);
    if (data.amountInvested !== undefined)
      updateData.amountInvested = parseFloat(data.amountInvested);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.amountReceived !== undefined)
      updateData.amountReceived = parseFloat(data.amountReceived);
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = parseFloat(data.exchangeRate);
    if (data.profitShare !== undefined)
      updateData.profitShare = data.profitShare;
    if (data.containerEquivalent !== undefined) {
      updateData.containerEquivalent = data.containerEquivalent
        ? parseFloat(data.containerEquivalent)
        : null;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Handle user connection
    if (data.userId !== undefined) {
      if (data.userId) {
        updateData.user = { connect: { id: parseInt(data.userId) } };
      } else {
        updateData.user = { disconnect: true };
      }
    }

    const investor = await prisma.investor.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
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
        amountInvested: true,
        amountReceived: true,
        exchangeRate: true,
        profitShare: true,
        containerEquivalent: true,
      },
    });

    return NextResponse.json(investor);
  } catch (error) {
    console.error("Error updating investor:", error);
    return NextResponse.json(
      { error: "Failed to update investor" },
      { status: 500 }
    );
  }
}

// Delete an investor
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  const { id } = params;

  try {
    await prisma.investor.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Investor deleted successfully" });
  } catch (error) {
    console.error("Error deleting investor:", error);
    return NextResponse.json(
      { error: "Failed to delete investor" },
      { status: 500 }
    );
  }
}
