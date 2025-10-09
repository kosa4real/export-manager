import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  const data = await req.json();
  const { name, contact } = data;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: { name, contact },
  });

  return NextResponse.json(supplier, { status: 201 });
}

export async function GET() {
  const suppliers = await prisma.supplier.findMany();
  return NextResponse.json(suppliers);
}
