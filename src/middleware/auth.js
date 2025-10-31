import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";
import { canUserAccessResource } from "@/lib/user-validation";

export async function requireAuth(request, requiredRole = null) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return { session, user: session.user };
}

export async function requireResourceAccess(
  request,
  resourceType,
  action = "read"
) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { session, user } = authResult;

  if (!canUserAccessResource(user.role, resourceType, action)) {
    return NextResponse.json(
      { error: `Access denied: Cannot ${action} ${resourceType}` },
      { status: 403 }
    );
  }

  return { session, user };
}

export function createAuthMiddleware(options = {}) {
  const {
    requiredRole = null,
    resourceType = null,
    action = "read",
    allowSelfAccess = false,
  } = options;

  return async function authMiddleware(request, context = {}) {
    try {
      let authResult;

      if (resourceType) {
        authResult = await requireResourceAccess(request, resourceType, action);
      } else {
        authResult = await requireAuth(request, requiredRole);
      }

      if (authResult instanceof NextResponse) {
        return authResult; // Return error response
      }

      const { session, user } = authResult;

      // Handle self-access for user-specific resources
      if (allowSelfAccess && context.params?.id) {
        const resourceId = parseInt(context.params.id);
        const userId = parseInt(user.id);

        if (resourceId === userId) {
          return { session, user, isSelfAccess: true };
        }
      }

      return { session, user, isSelfAccess: false };
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      );
    }
  };
}

// Pre-configured middleware functions
export const requireAdmin = createAuthMiddleware({ requiredRole: "ADMIN" });
export const requireStaffOrAdmin = createAuthMiddleware({
  requiredRole: ["STAFF", "ADMIN"],
});

export const requireUserManagement = createAuthMiddleware({
  resourceType: "users",
  action: "read",
});

export const requireUserCreation = createAuthMiddleware({
  resourceType: "users",
  action: "create",
});

export const requireUserUpdate = createAuthMiddleware({
  resourceType: "users",
  action: "update",
  allowSelfAccess: true,
});

export const requireUserDeletion = createAuthMiddleware({
  resourceType: "users",
  action: "delete",
});
