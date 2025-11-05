import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST() {
  try {
    return await withDb(async (prisma) => {
      // Check if admin already exists
      const existingAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (existingAdmin) {
        return NextResponse.json({
          message: "Admin user already exists",
          email: existingAdmin.email,
        });
      }

      // Create admin user
      const passwordHash = await bcrypt.hash("admin123", 12);

      const admin = await prisma.user.create({
        data: {
          username: "admin",
          email: "admin@gmail.com",
          passwordHash,
          role: "ADMIN",
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: "Admin user created successfully",
        user: admin,
        loginCredentials: {
          email: "admin@gmail.com",
          password: "admin123",
        },
      });
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
