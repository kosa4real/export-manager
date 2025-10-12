import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma"; // ✅ Correct path

const prisma = new PrismaClient();

export async function GET() {
  try {
    const suppliers = await prisma.coalSupplier.findMany({
      take: 5,
      select: { id: true, name: true },
    });
    return NextResponse.json({ message: "Database connected", suppliers });
  } catch (error) {
    console.error("Prisma error:", error); // helpful for debugging
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
