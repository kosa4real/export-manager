import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import bcrypt from "bcrypt";

// Get all users (Admin only)
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const skip = (page - 1) * limit;

  try {
    return await withDb(async (prisma) => {
      const where = {};

      if (search) {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            investorId: true,
            investor: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return NextResponse.json({
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Create a new user (Admin only)
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const data = await request.json();

    // Validation
    if (!data.username || !data.email || !data.password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (data.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    return await withDb(async (prisma) => {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email or username already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // Create user
      const userData = {
        username: data.username,
        email: data.email,
        passwordHash,
        role: data.role || "STAFF",
      };

      // If creating an investor user, link to investor
      if (data.investorId) {
        userData.investorId = parseInt(data.investorId);
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          investorId: true,
          investor: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return NextResponse.json(user, { status: 201 });
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
