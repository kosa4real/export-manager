// User validation utilities

export const validateUserData = (data, isUpdate = false) => {
  const errors = [];

  // Username validation
  if (!data.username || data.username.trim().length === 0) {
    errors.push("Username is required");
  } else if (data.username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  } else if (data.username.length > 50) {
    errors.push("Username must be less than 50 characters");
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
    errors.push(
      "Username can only contain letters, numbers, hyphens, and underscores"
    );
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Please enter a valid email address");
  } else if (data.email.length > 100) {
    errors.push("Email must be less than 100 characters");
  }

  // Password validation (only for new users or when password is provided)
  if (!isUpdate || (isUpdate && data.password)) {
    if (!data.password || data.password.length === 0) {
      errors.push("Password is required");
    } else if (data.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    } else if (data.password.length > 255) {
      errors.push("Password must be less than 255 characters");
    }
  }

  // Role validation
  const validRoles = ["ADMIN", "STAFF", "INVESTOR"];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.push("Please select a valid role");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeUserData = (data) => {
  return {
    username: data.username?.trim(),
    email: data.email?.trim().toLowerCase(),
    password: data.password,
    role: data.role,
    investorId: data.investorId ? parseInt(data.investorId) : null,
  };
};

export const getUserPermissions = (userRole) => {
  const permissions = {
    ADMIN: {
      canManageUsers: true,
      canManageInvestors: true,
      canManageSuppliers: true,
      canManageExports: true,
      canViewAllData: true,
      canDeleteRecords: true,
    },
    STAFF: {
      canManageUsers: false,
      canManageInvestors: true,
      canManageSuppliers: true,
      canManageExports: true,
      canViewAllData: true,
      canDeleteRecords: false,
    },
    INVESTOR: {
      canManageUsers: false,
      canManageInvestors: false,
      canManageSuppliers: false,
      canManageExports: false,
      canViewAllData: false,
      canDeleteRecords: false,
    },
  };

  return permissions[userRole] || permissions.INVESTOR;
};

export const canUserAccessResource = (
  userRole,
  resourceType,
  action = "read"
) => {
  const permissions = getUserPermissions(userRole);

  const resourcePermissions = {
    users: {
      read: permissions.canManageUsers,
      create: permissions.canManageUsers,
      update: permissions.canManageUsers,
      delete: permissions.canManageUsers,
    },
    investors: {
      read: permissions.canManageInvestors || userRole === "INVESTOR",
      create: permissions.canManageInvestors,
      update: permissions.canManageInvestors,
      delete: permissions.canManageInvestors && permissions.canDeleteRecords,
    },
    suppliers: {
      read: permissions.canManageSuppliers,
      create: permissions.canManageSuppliers,
      update: permissions.canManageSuppliers,
      delete: permissions.canManageSuppliers && permissions.canDeleteRecords,
    },
    exports: {
      read: permissions.canManageExports || userRole === "INVESTOR",
      create: permissions.canManageExports,
      update: permissions.canManageExports,
      delete: permissions.canManageExports && permissions.canDeleteRecords,
    },
  };

  return resourcePermissions[resourceType]?.[action] || false;
};
