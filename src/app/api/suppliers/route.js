import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const {
      supplierId,
      supplyDate,
      quantity,
      amountPaid,
      gradeCleanA,
      gradeCleanB,
      rejected,
      dust,
      wood,
    } = data;

    if (!supplierId || !supplyDate || !quantity || amountPaid === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supply = await prisma.supply.create({
      data: {
        supplierId: parseInt(supplierId),
        supplyDate: new Date(supplyDate),
        quantity: parseInt(quantity),
        amountPaid: parseFloat(amountPaid),
        gradeCleanA: parseInt(gradeCleanA) || 0,
        gradeCleanB: parseInt(gradeCleanB) || 0,
        rejected: parseInt(rejected) || 0,
        dust: parseInt(dust) || 0,
        wood: parseInt(wood) || 0,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(supply, { status: 201 });
  } catch (error) {
    console.error("Error creating supply:", error);
    return NextResponse.json(
      { error: "Failed to create supply" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const supplierId = url.searchParams.get("supplierId");

    const where = supplierId ? { supplierId: parseInt(supplierId) } : {};

    const supplies = await prisma.supply.findMany({
      where,
      orderBy: {
        supplyDate: "desc",
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(supplies);
  } catch (error) {
    console.error("Error fetching supplies:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplies" },
      { status: 500 }
    );
  }
}
