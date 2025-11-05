import { NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import bcrypt from "bcrypt";

// Bulk operations for users (Admin only)
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const { action, userIds, data } = await request.json();

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Action and userIds are required" },
        { status: 400 }
      );
    }

    let result = {};

    switch (action) {
      case "delete":
        // Prevent admin from deleting themselves
        const currentUserId = parseInt(session.user.id);
        if (userIds.includes(currentUserId)) {
          return NextResponse.json(
            { error: "Cannot delete your own account" },
            { status: 400 }
          );
        }

        // Check for users with dependencies
        const usersWithDependencies = await prisma.user.findMany({
          where: {
            id: { in: userIds },
            dataRequests: { some: {} },
          },
          select: { id: true, username: true },
        });

        if (usersWithDependencies.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot delete users with existing data requests: ${usersWithDependencies
                .map((u) => u.username)
                .join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Unlink from investors before deletion
        await prisma.investor.updateMany({
          where: { user: { id: { in: userIds } } },
          data: { user: { disconnect: true } },
        });

        // Delete users
        const deleteResult = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });

        result = {
          action: "delete",
          deletedCount: deleteResult.count,
          message: `Successfully deleted ${deleteResult.count} users`,
        };
        break;

      case "updateRole":
        if (
          !data?.role ||
          !["ADMIN", "STAFF", "INVESTOR"].includes(data.role)
        ) {
          return NextResponse.json(
            { error: "Valid role is required" },
            { status: 400 }
          );
        }

        // Prevent admin from changing their own role
        if (userIds.includes(parseInt(session.user.id))) {
          return NextResponse.json(
            { error: "Cannot change your own role" },
            { status: 400 }
          );
        }

        const updateResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role },
        });

        result = {
          action: "updateRole",
          updatedCount: updateResult.count,
          role: data.role,
          message: `Successfully updated ${updateResult.count} users to ${data.role} role`,
        };
        break;

      case "resetPassword":
        if (!data?.password || data.password.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters long" },
            { status: 400 }
          );
        }

        const passwordHash = await bcrypt.hash(data.password, 12);
        const passwordResult = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { passwordHash },
        });

        result = {
          action: "resetPassword",
          updatedCount: passwordResult.count,
          message: `Successfully reset password for ${passwordResult.count} users`,
        };
        break;

      case "toggleStatus":
        // This could be used for future user status management
        return NextResponse.json(
          { error: "Status toggle not implemented yet" },
          { status: 400 }
        );

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in bulk user operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}
