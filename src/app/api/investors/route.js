import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// Get all investors
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const status = searchParams.get("status");

  const isAdmin = session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR";

  try {
    if (isInvestor) {
      // Investors only see their own record
      const investor = await prisma.investor.findFirst({
        where: {
          user: { id: parseInt(session.user.id) },
        },
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
        },
      });

      return NextResponse.json({
        investors: investor ? [investor] : [],
        total: investor ? 1 : 0,
        page: 1,
        limit: 1,
      });
    }

    const where = {};
    if (status) {
      where.status = status;
    }

    const [investors, total] = await Promise.all([
      prisma.investor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { investmentDate: "desc" },
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
        },
      }),
      prisma.investor.count({ where }),
    ]);

    return NextResponse.json({
      investors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching investors:", error);
    return NextResponse.json(
      { error: "Failed to fetch investors" },
      { status: 500 }
    );
  }
}

// Create a new investor
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Access denied: Admin only" },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();

    const investorData = {
      name: data.name,
      contactInfo: data.contactInfo || null,
      email: data.email || null,
      investmentDate: new Date(data.investmentDate),
      amountInvested: parseFloat(data.amountInvested),
      currency: data.currency || "USD",
      bankName: data.bankName,
      amountReceived: parseFloat(data.amountReceived) || 0,
      exchangeRate: parseFloat(data.exchangeRate) || 1,
      profitShare: data.profitShare,
      containerEquivalent: data.containerEquivalent
        ? parseFloat(data.containerEquivalent)
        : null,
      status: data.status || "ACTIVE",
      isActive: data.isActive ?? true,
      notes: data.notes || null,
    };

    // Connect to user if userId is provided
    if (data.userId) {
      investorData.user = {
        connect: { id: parseInt(data.userId) },
      };
    }

    const investor = await prisma.investor.create({
      data: investorData,
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

    return NextResponse.json(investor, { status: 201 });
  } catch (error) {
    console.error("Error creating investor:", error);
    return NextResponse.json(
      { error: "Failed to create investor" },
      { status: 500 }
    );
  }
}
