import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

// GET /api/exports — Fetch paginated export shipments
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );
    const skip = (page - 1) * limit;
    const destinationCountry = searchParams.get("destinationCountry");
    const status = searchParams.get("status");
    const isAdmin = session.user.role === "ADMIN";
    const isInvestor = session.user.role === "INVESTOR";


    console.log(
      `[EXPORTS API] Fetching exports for user: ${session.user.email}, role: ${session.user.role}`
    );

    try {
      const where = {};
      if (destinationCountry) {
        where.destinationCountry = destinationCountry;
      }
      if (status) {
        where.status = status;
      }

      // If user is an investor, only show exports assigned to them
      if (isInvestor) {
        // Find the investor record linked to this user
        const investor = await prisma.investor.findFirst({
          where: { user: { id: parseInt(session.user.id) } },
          select: { id: true },
        });

        if (investor) {
          where.assignedInvestorId = investor.id;
        } else {
          // If no investor record found, return empty results
          return NextResponse.json({
            exports: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
            message:
              "No investment assignments found. Please contact an admin.",
          });
        }
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
            departureClearingAgent: true,
            departureClearingFee: true,
            arrivalClearingAgent: true,
            arrivalClearingFee: true,
            clearingAgent: true, // Keep for backward compatibility
            buyer: true,
            containerNumber: true,
            status: true,
            notes: true,
            assignedInvestorId: true,
            createdAt: true,
            updatedAt: true,
            assignedInvestor: {
              select: {
                id: true,
                name: true,
                profitShare: true,
              },
            },
            ...(isAdmin && {
              amountReceived: true,
              clearingFee: true,
              netProfit: true,
            }),
            // For investors, show financial data but calculate their share
            ...(isInvestor && {
              amountReceived: true,
              clearingFee: true,
              netProfit: true,
            }),
          },
        }),
        prisma.exportShipment.count({ where }),
      ]);

      // Calculate investor profit share for investor users
      if (isInvestor && exports.length > 0) {
        const investor = await prisma.investor.findFirst({
          where: { user: { id: parseInt(session.user.id) } },
          select: { profitShare: true },
        });

        if (investor) {
          exports.forEach((exportItem) => {
            if (exportItem.netProfit && investor.profitShare) {
              // Parse profit share (e.g., "50/50" -> 50%)
              const shareMatch = investor.profitShare.match(/(\d+)/);
              const sharePercentage = shareMatch ? parseInt(shareMatch[1]) : 50;
              exportItem.investorProfit =
                (exportItem.netProfit * sharePercentage) / 100;
            }
          });
        }
      }

      console.log(
        `[EXPORTS API] Successfully fetched ${exports.length} exports out of ${total} total`
      );

      return NextResponse.json({
        exports,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (innerError) {
      console.error("Inner error fetching exports:", innerError);
      return NextResponse.json(
        {
          error: "Failed to fetch exports",
          details: innerError.message,
          code: innerError.code,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Outer error in exports API:", error);
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
  }
}

// POST /api/exports — Create new export shipment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }


    console.log(
      `[EXPORTS API] Creating new export by user: ${session.user.email}`
    );

    const data = await request.json();
    const isAdmin = session.user.role === "ADMIN";

    // ✅ Validate required fields
    if (!data.exportDate || !data.quantityBags || !data.departureDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: exportDate, quantityBags, departureDate",
        },
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
        console.warn(
          `Invalid status received: "${data.status}". Using default "PENDING".`
        );
      }
    }

    const exportData = {
      exportDate: new Date(data.exportDate),
      quantityBags: parseInt(data.quantityBags, 10),
      departureDate: new Date(data.departureDate),
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      destinationCountry: data.destinationCountry || "",
      destinationCity: data.destinationCity || "",
      departureClearingAgent: data.departureClearingAgent || null,
      departureClearingFee: data.departureClearingFee
        ? parseFloat(data.departureClearingFee)
        : null,
      arrivalClearingAgent: data.arrivalClearingAgent || null,
      arrivalClearingFee: data.arrivalClearingFee
        ? parseFloat(data.arrivalClearingFee)
        : null,
      buyer: data.buyer || null,
      containerNumber: data.containerNumber || null,
      status: statusValue, // ✅ Now guaranteed to be a valid enum value
      notes: data.notes || null,
      assignedInvestorId: data.assignedInvestorId
        ? parseInt(data.assignedInvestorId)
        : null,
    };

    // ✅ Admin-only financial fields
    if (isAdmin) {
      if (data.amountReceived !== undefined && data.amountReceived !== null) {
        exportData.amountReceived = parseFloat(data.amountReceived);
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
        departureClearingAgent: true,
        departureClearingFee: true,
        arrivalClearingAgent: true,
        arrivalClearingFee: true,
        clearingAgent: true, // Keep for backward compatibility
        buyer: true,
        containerNumber: true,
        status: true,
        notes: true,
        assignedInvestorId: true,
        assignedInvestor: {
          select: {
            id: true,
            name: true,
            profitShare: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        ...(isAdmin && {
          amountReceived: true,
          clearingFee: true, // Keep for backward compatibility
          netProfit: true,
        }),
      },
    });

    console.log(
      `[EXPORTS API] Successfully created export with ID: ${newExport.id}`
    );

    return NextResponse.json(newExport, { status: 201 });
  } catch (error) {
    console.error("Error creating export:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Duplicate entry",
          details: "An export with this container number already exists",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Invalid reference",
          details: "The assigned investor does not exist",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create export",
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  } finally {
  }
}
