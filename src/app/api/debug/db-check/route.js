import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Check if admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      userCount,
      users,
      adminUser,
      hasAdmin: !!adminUser,
    });
  } catch (error) {
    console.error("Error checking database:", error);
    return NextResponse.json(
      { error: "Failed to check database", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Create default admin user if none exists
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminUser) {
      return NextResponse.json({
        message: "Admin user already exists",
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    }

    // Create admin user
    const passwordHash = await bcrypt.hash("admin123", 12);
    const newAdmin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@coalmanager.com",
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
      admin: newAdmin,
      credentials: {
        email: "admin@coalmanager.com",
        password: "admin123",
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user", details: error.message },
      { status: 500 }
    );
  }
}
