import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEST ENDPOINT - Remove in production
// This bypasses authentication for testing purposes
export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Received data:", JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.exportDate || !data.quantityBags || !data.departureDate) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["exportDate", "quantityBags", "departureDate"],
          received: Object.keys(data),
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
    const status = validStatuses.includes(data.status?.toUpperCase())
      ? data.status.toUpperCase()
      : "PENDING";

    const exportData = {
      exportDate: new Date(data.exportDate),
      quantityBags: parseInt(data.quantityBags),
      departureDate: new Date(data.departureDate),
      arrivalDate: data.arrivalDate ? new Date(data.arrivalDate) : null,
      destinationCountry: data.destinationCountry || "",
      destinationCity: data.destinationCity || "",
      clearingAgent: data.clearingAgent || null,
      buyer: data.buyer || null,
      containerNumber: data.containerNumber || null,
      status: status,
      notes: data.notes || null,
      // Include financial fields for testing
      amountReceived: data.amountReceived
        ? parseFloat(data.amountReceived)
        : null,
      clearingFee: data.clearingFee ? parseFloat(data.clearingFee) : null,
      netProfit: data.netProfit ? parseFloat(data.netProfit) : null,
    };

    console.log("Processed export data:", JSON.stringify(exportData, null, 2));

    const newExport = await prisma.exportShipment.create({
      data: exportData,
    });

    console.log("Created export:", JSON.stringify(newExport, null, 2));

    return NextResponse.json(
      {
        success: true,
        export: newExport,
        message: "Export created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating export:", error);

    // More detailed error info for debugging
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Unique constraint violation",
          details: error.meta,
          message: "Container number already exists or duplicate entry",
        },
        { status: 400 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Foreign key constraint violation",
          details: error.meta,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create export",
        details: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test database connection
export async function GET() {
  try {
    const count = await prisma.exportShipment.count();
    return NextResponse.json({
      message: "Test endpoint working",
      exportCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
