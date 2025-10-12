import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/exports — Fetch paginated export shipments
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const destinationCountry = searchParams.get("destinationCountry");
  const status = searchParams.get("status");
  const isAdmin = session.user.role === "ADMIN";

  try {
    const where = {};
    if (destinationCountry) {
      where.destinationCountry = destinationCountry;
    }
    if (status) {
      where.status = status;
    }

    const [exports, total] = await Promise.all([
      prisma.exportShipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { exportDate: "desc" },
        select: {
          id: true,
          exportDate: true,
          quantityBags: true,
          departureDate: true,
          arrivalDate: true,
          destinationCountry: true,
          destinationCity: true,
          clearingAgent: true,
          buyer: true,
          containerNumber: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          ...(isAdmin && {
            amountReceived: true,
            clearingFee: true,
            netProfit: true,
          }),
        },
      }),
      prisma.exportShipment.count({ where }),
    ]);

    return NextResponse.json({
      exports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching exports:", error);
    return NextResponse.json(
      { error: "Failed to fetch exports" },
      { status: 500 }
    );
  }
}

// POST /api/exports — Create new export shipment
// POST /api/exports — Create new export shipment
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const isAdmin = session.user.role === "ADMIN";

    // ✅ Validate required fields
    if (!data.exportDate || !data.quantityBags || !data.departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: exportDate, quantityBags, departureDate" },
        { status: 400 }
      );
    }

    // ✅ VALIDATE AGAINST ACTUAL PRISMA ENUM
    const VALID_STATUSES = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
    let statusValue = "PENDING"; // default

    if (data.status) {
      const upperStatus = data.status.trim().toUpperCase();
      if (VALID_STATUSES.includes(upperStatus)) {
        statusValue = upperStatus;
      } else {
        console.warn(`Invalid status received: "${data.status}". Using default "PENDING".`);
      }
    }

    const exportData = {
      exportDate: new Date(data.exportDate),
      quantityBags: parseInt(data.quantityBags, 10),
      departureDate: new Date(data.departureDate),
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      destinationCountry: data.destinationCountry || "",
      destinationCity: data.destinationCity || "",
      clearingAgent: data.clearingAgent || null,
      buyer: data.buyer || null,
      containerNumber: data.containerNumber || null,
      status: statusValue, // ✅ Now guaranteed to be a valid enum value
      notes: data.notes || null,
    };

    // ✅ Admin-only financial fields
    if (isAdmin) {
      if (data.amountReceived !== undefined && data.amountReceived !== null) {
        exportData.amountReceived = parseFloat(data.amountReceived);
      }
      if (data.clearingFee !== undefined && data.clearingFee !== null) {
        exportData.clearingFee = parseFloat(data.clearingFee);
      }
      if (data.netProfit !== undefined && data.netProfit !== null) {
        exportData.netProfit = parseFloat(data.netProfit);
      }
    }

    const newExport = await prisma.exportShipment.create({
      data: exportData,
      select: {
        id: true,
        exportDate: true,
        quantityBags: true,
        departureDate: true,
        arrivalDate: true,
        destinationCountry: true,
        destinationCity: true,
        clearingAgent: true,
        buyer: true,
        containerNumber: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        ...(isAdmin && {
          amountReceived: true,
          clearingFee: true,
          netProfit: true,
        }),
      },
    });

    return NextResponse.json(newExport, { status: 201 });
  } catch (error) {
    console.error("Error creating export:", error);
    return NextResponse.json(
      { 
        error: "Failed to create export",
        details: error.message 
      },
      { status: 500 }
    );
  }
}