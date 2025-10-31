# User Management System

## Overview

This document describes the comprehensive user management system implemented for the Coal Export Management application. The system provides role-based access control, user CRUD operations, and secure authentication.

## Features

### 1. User Roles & Permissions

#### ADMIN

- Full system access
- Can manage all users (create, read, update, delete)
- Can manage all business entities (investors, suppliers, exports)
- Can view all data and delete records
- Cannot delete their own account or change their own role

#### STAFF

- Operational access
- Can manage business operations (investors, suppliers, exports)
- Can view all operational data
- Cannot manage users or delete records
- Cannot access user management features

#### INVESTOR

- Limited access
- Can only view their own investment data
- Can view related export information
- Cannot manage any business entities
- Cannot access administrative features

### 2. User Management Features

#### User Creation

- Admin-only functionality
- Required fields: username, email, password, role
- Optional investor linking for investor users
- Automatic password hashing with bcrypt
- Email and username uniqueness validation

#### User Updates

- Admins can update any user
- Users can update their own profile (username, email, password)
- Password change requires current password for self-updates
- Role changes restricted (admins cannot change their own role)

#### User Deletion

- Admin-only functionality
- Cannot delete users with existing data requests
- Cannot delete own account
- Automatically unlinks from investor records
- Soft validation for data integrity

#### Bulk Operations

- Bulk delete users
- Bulk role updates
- Bulk password reset
- Proper validation and error handling

### 3. Security Features

#### Authentication

- NextAuth.js integration
- JWT-based sessions
- Secure password hashing (bcrypt with salt rounds: 12)
- Session-based route protection

#### Authorization

- Role-based access control (RBAC)
- Resource-level permissions
- API route protection middleware
- Client-side route guards

#### Validation

- Input sanitization
- Email format validation
- Username pattern validation (alphanumeric, hyphens, underscores)
- Password strength requirements (minimum 6 characters)
- Duplicate prevention (email/username uniqueness)

## API Endpoints

### User CRUD Operations

#### GET /api/users

- **Access**: Admin only
- **Purpose**: List all users with pagination and filtering
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by username or email
  - `role`: Filter by role (ADMIN, STAFF, INVESTOR)

#### POST /api/users

- **Access**: Admin only
- **Purpose**: Create a new user
- **Body**: `{ username, email, password, role, investorId? }`

#### GET /api/users/[id]

- **Access**: Admin only
- **Purpose**: Get single user details
- **Returns**: User data with linked investor information

#### PUT /api/users/[id]

- **Access**: Admin or self
- **Purpose**: Update user information
- **Body**: `{ username?, email?, password?, role?, investorId? }`

#### DELETE /api/users/[id]

- **Access**: Admin only
- **Purpose**: Delete a user
- **Restrictions**: Cannot delete self or users with dependencies

### Bulk Operations

#### POST /api/users/bulk

- **Access**: Admin only
- **Purpose**: Perform bulk operations on users
- **Actions**:
  - `delete`: Bulk delete users
  - `updateRole`: Bulk role update
  - `resetPassword`: Bulk password reset

## Components

### 1. UserManagementModal

- Modal component for user creation and editing
- Form validation and error handling
- Investor linking functionality
- Password visibility toggle

### 2. UserForm

- Reusable form component for user data
- Client-side validation
- Role selection with descriptions
- Investor linking dropdown

### 3. UserProfile

- Comprehensive user profile view
- Self-service profile editing
- Password change functionality
- Account activity information

### 4. UsersPage

- Main user management interface
- User listing with search and filters
- Pagination support
- Bulk operations interface

## Database Schema

### User Model

```prisma
model User {
  id           Int           @id @default(autoincrement())
  username     String        @unique @db.VarChar(50)
  email        String        @unique @db.VarChar(100)
  passwordHash String        @db.VarChar(255)
  role         UserRole      @default(STAFF)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  investorId   Int?          @unique
  dataRequests DataRequest[] @relation("CreatedBy")
  investor     Investor?     @relation("InvestorUser", fields: [investorId], references: [id])
}

enum UserRole {
  ADMIN
  STAFF
  INVESTOR
}
```

## Usage Examples

### Creating a New User

```javascript
const userData = {
  username: "john_doe",
  email: "john@example.com",
  password: "securePassword123",
  role: "STAFF",
  investorId: null, // Optional
};

const response = await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(userData),
});
```

### Updating User Role

```javascript
const updateData = {
  role: "ADMIN",
};

const response = await fetch(`/api/users/${userId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(updateData),
});
```

### Bulk Delete Users

```javascript
const bulkData = {
  action: "delete",
  userIds: [1, 2, 3],
};

const response = await fetch("/api/users/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(bulkData),
});
```

## Best Practices

### Security

1. Always validate user input on both client and server
2. Use parameterized queries to prevent SQL injection
3. Implement proper session management
4. Hash passwords with strong algorithms (bcrypt)
5. Validate permissions on every API call

### User Experience

1. Provide clear error messages
2. Implement loading states for async operations
3. Use confirmation dialogs for destructive actions
4. Provide search and filtering capabilities
5. Implement proper pagination for large datasets

### Data Integrity

1. Check for dependencies before deletion
2. Maintain referential integrity
3. Use transactions for complex operations
4. Implement proper error handling
5. Log important user management actions

## Error Handling

### Common Error Scenarios

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: Insufficient permissions
- **409 Conflict**: Duplicate email/username
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Server-side errors

### Error Response Format

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE", // Optional
  "details": {} // Optional additional details
}
```

## Future Enhancements

### Planned Features

1. User activity logging and audit trails
2. Advanced password policies
3. Two-factor authentication (2FA)
4. User status management (active/inactive/suspended)
5. Advanced bulk operations
6. User import/export functionality
7. Email notifications for user actions
8. Advanced search and filtering options

### Performance Optimizations

1. Implement caching for user permissions
2. Add database indexes for search fields
3. Implement virtual scrolling for large user lists
4. Add request rate limiting
5. Optimize database queries with proper joins

## Troubleshooting

### Common Issues

1. **Cannot delete user**: Check for existing data requests or dependencies
2. **Permission denied**: Verify user role and permissions
3. **Duplicate user error**: Check for existing email/username
4. **Password reset fails**: Ensure proper validation and hashing
5. **Session issues**: Check NextAuth configuration and JWT settings

### Debug Steps

1. Check browser console for client-side errors
2. Review server logs for API errors
3. Verify database constraints and relationships
4. Test API endpoints with proper authentication
5. Validate user permissions and roles
