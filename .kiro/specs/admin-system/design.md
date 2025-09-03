# Admin System Design Document

## Overview

The admin system extends the existing LocalNest platform with comprehensive administrative capabilities. It introduces a new ADMIN user type alongside the existing CUSTOMER and PROVIDER types, providing a centralized management interface for platform oversight, provider verification, user management, and system analytics.

The design leverages the existing authentication and authorization infrastructure while adding admin-specific middleware, routes, and frontend components. The system maintains security through role-based access control and audit logging.

## Architecture

### Database Schema Extensions

The admin system requires minimal database schema changes:

1. **UserType Enum Extension**: Add `ADMIN` to the existing `UserType` enum
2. **Admin Model**: Create a new `Admin` model similar to `Customer` and `Provider`
3. **Audit Log Model**: New model to track administrative actions
4. **Provider Verification Enhancement**: Add rejection reason and admin ID fields

```prisma
enum UserType {
  CUSTOMER
  PROVIDER
  ADMIN
}

model Admin {
  id        Int      @id @default(autoincrement())
  userId    Int      @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("admins")
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  adminId     Int
  action      String
  targetType  String   // 'USER', 'PROVIDER', 'SERVICE', etc.
  targetId    Int?
  details     Json?
  createdAt   DateTime @default(now())
  admin       Admin    @relation(fields: [adminId], references: [id])
  
  @@map("audit_logs")
}

model Provider {
  // ... existing fields
  verificationRejectedReason String?
  verifiedBy                 Int?
  verifiedAt                 DateTime?
  verifiedByAdmin            Admin?   @relation(fields: [verifiedBy], references: [id])
}
```

### Backend Architecture

#### Middleware Layer
- **Admin Authentication Middleware**: Extends existing auth middleware to verify admin privileges
- **Audit Logging Middleware**: Automatically logs admin actions
- **Rate Limiting**: Enhanced rate limiting for admin endpoints

#### API Routes Structure
```
/api/admin/
├── auth/
│   ├── login (POST) - Admin-specific login with enhanced security
│   └── profile (GET) - Admin profile information
├── dashboard/
│   └── stats (GET) - Platform statistics and metrics
├── users/
│   ├── / (GET) - List all users with filtering
│   ├── /:id (GET) - Get specific user details
│   ├── /:id/activate (PUT) - Activate/deactivate user
│   └── /:id/delete (DELETE) - Soft delete user
├── providers/
│   ├── / (GET) - List all providers with filtering
│   ├── /:id (GET) - Get provider details
│   ├── /:id/verify (PUT) - Approve provider verification
│   ├── /:id/reject (PUT) - Reject provider verification
│   └── pending-verifications (GET) - Get pending verifications
├── services/
│   ├── / (GET, POST) - List/create services
│   ├── /:id (GET, PUT, DELETE) - Manage specific service
│   └── categories (GET, POST) - Manage service categories
├── bookings/
│   ├── / (GET) - List all bookings with filtering
│   └── /:id (GET) - Get booking details
└── analytics/
    ├── overview (GET) - Platform overview metrics
    ├── users (GET) - User analytics
    ├── bookings (GET) - Booking analytics
    └── revenue (GET) - Revenue analytics
```

#### Service Layer
- **AdminService**: Core admin business logic
- **VerificationService**: Provider verification workflow
- **AnalyticsService**: Platform metrics and reporting
- **AuditService**: Action logging and audit trails

### Frontend Architecture

#### Component Structure
```
src/
├── components/
│   └── admin/
│       ├── AdminLayout.jsx - Main admin layout wrapper
│       ├── AdminSidebar.jsx - Navigation sidebar
│       ├── AdminHeader.jsx - Admin-specific header
│       ├── Dashboard/
│       │   ├── AdminDashboard.jsx - Main dashboard
│       │   ├── StatsCard.jsx - Metric display cards
│       │   └── RecentActivity.jsx - Recent actions
│       ├── UserManagement/
│       │   ├── UserList.jsx - User listing with filters
│       │   ├── UserDetails.jsx - Detailed user view
│       │   └── UserActions.jsx - User action buttons
│       ├── ProviderManagement/
│       │   ├── ProviderList.jsx - Provider listing
│       │   ├── ProviderDetails.jsx - Provider profile view
│       │   ├── VerificationQueue.jsx - Pending verifications
│       │   └── VerificationModal.jsx - Approve/reject modal
│       ├── ServiceManagement/
│       │   ├── ServiceList.jsx - Service catalog
│       │   ├── ServiceForm.jsx - Add/edit services
│       │   └── CategoryManager.jsx - Category management
│       └── Analytics/
│           ├── AnalyticsDashboard.jsx - Analytics overview
│           ├── UserAnalytics.jsx - User metrics
│           ├── BookingAnalytics.jsx - Booking trends
│           └── RevenueAnalytics.jsx - Revenue reports
├── pages/
│   └── admin/
│       ├── AdminLogin.jsx - Admin login page
│       ├── AdminDashboard.jsx - Main admin page
│       ├── UserManagement.jsx - User management page
│       ├── ProviderManagement.jsx - Provider management
│       ├── ServiceManagement.jsx - Service management
│       └── Analytics.jsx - Analytics page
└── hooks/
    └── admin/
        ├── useAdminAuth.js - Admin authentication
        ├── useAdminStats.js - Dashboard statistics
        ├── useUserManagement.js - User operations
        └── useProviderVerification.js - Verification workflow
```

#### Routing Structure
```javascript
// Admin routes with protection
<Route path="/admin" element={<AdminProtectedRoute />}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="providers" element={<ProviderManagement />} />
  <Route path="services" element={<ServiceManagement />} />
  <Route path="analytics" element={<Analytics />} />
</Route>
```

## Components and Interfaces

### Backend Components

#### AdminController
```javascript
class AdminController {
  async getDashboardStats(req, res)
  async getUsers(req, res)
  async getUserById(req, res)
  async updateUserStatus(req, res)
  async getProviders(req, res)
  async getPendingVerifications(req, res)
  async verifyProvider(req, res)
  async rejectProvider(req, res)
  async getServices(req, res)
  async createService(req, res)
  async updateService(req, res)
  async deleteService(req, res)
  async getAnalytics(req, res)
}
```

#### AdminMiddleware
```javascript
const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const auditLog = (action, targetType) => {
  return async (req, res, next) => {
    // Log admin action after successful operation
  };
};
```

### Frontend Components

#### AdminDashboard Component
```javascript
const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();
  const { pendingVerifications } = useProviderVerification();
  
  return (
    <AdminLayout>
      <div className="dashboard-grid">
        <StatsCard title="Total Users" value={stats.totalUsers} />
        <StatsCard title="Active Providers" value={stats.activeProviders} />
        <StatsCard title="Pending Verifications" value={pendingVerifications.length} />
        <RecentActivity activities={stats.recentActivities} />
      </div>
    </AdminLayout>
  );
};
```

#### VerificationQueue Component
```javascript
const VerificationQueue = () => {
  const { pendingVerifications, verifyProvider, rejectProvider } = useProviderVerification();
  
  const handleVerify = async (providerId) => {
    await verifyProvider(providerId);
    // Update UI and show success message
  };
  
  const handleReject = async (providerId, reason) => {
    await rejectProvider(providerId, reason);
    // Update UI and show success message
  };
  
  return (
    <div className="verification-queue">
      {pendingVerifications.map(provider => (
        <ProviderVerificationCard 
          key={provider.id}
          provider={provider}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      ))}
    </div>
  );
};
```

## Data Models

### Admin Model
```javascript
{
  id: number,
  userId: number,
  createdAt: Date,
  updatedAt: Date,
  user: {
    id: number,
    firstName: string,
    lastName: string,
    email: string,
    userType: 'ADMIN'
  }
}
```

### Dashboard Stats Model
```javascript
{
  totalUsers: number,
  totalCustomers: number,
  totalProviders: number,
  activeProviders: number,
  pendingVerifications: number,
  totalBookings: number,
  completedBookings: number,
  totalRevenue: number,
  recentActivities: Array<{
    id: number,
    action: string,
    timestamp: Date,
    details: string
  }>
}
```

### Provider Verification Model
```javascript
{
  id: number,
  provider: {
    id: number,
    user: {
      firstName: string,
      lastName: string,
      email: string
    },
    experience: string,
    location: string,
    bio: string,
    services: Array<Service>
  },
  verificationRequestedAt: Date,
  documents?: Array<string>,
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}
```

## Error Handling

### Admin-Specific Error Types
```javascript
class AdminError extends Error {
  constructor(message, code, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Error codes
const ADMIN_ERRORS = {
  INSUFFICIENT_PRIVILEGES: 'ADMIN_001',
  INVALID_ADMIN_TOKEN: 'ADMIN_002',
  VERIFICATION_FAILED: 'ADMIN_003',
  USER_NOT_FOUND: 'ADMIN_004',
  PROVIDER_NOT_FOUND: 'ADMIN_005',
  SERVICE_IN_USE: 'ADMIN_006'
};
```

### Error Handling Middleware
```javascript
const adminErrorHandler = (error, req, res, next) => {
  // Log admin errors with additional context
  console.error(`Admin Error [${req.user?.email}]:`, error);
  
  if (error instanceof AdminError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code
    });
  }
  
  // Default error handling
  res.status(500).json({ message: 'Internal server error' });
};
```

## Testing Strategy

### Backend Testing

#### Unit Tests
- Admin middleware functionality
- Admin service methods
- Verification workflow logic
- Analytics calculation accuracy

#### Integration Tests
- Admin API endpoints
- Database operations
- Authentication and authorization
- Audit logging functionality

#### Test Structure
```javascript
describe('Admin System', () => {
  describe('Authentication', () => {
    it('should authenticate admin users');
    it('should reject non-admin users');
    it('should handle admin token validation');
  });
  
  describe('Provider Verification', () => {
    it('should approve provider verification');
    it('should reject provider verification with reason');
    it('should update provider status correctly');
  });
  
  describe('User Management', () => {
    it('should list users with filters');
    it('should activate/deactivate users');
    it('should fetch user details');
  });
});
```

### Frontend Testing

#### Component Tests
- Admin dashboard rendering
- User management interactions
- Provider verification workflow
- Service management operations

#### Integration Tests
- Admin routing and navigation
- API integration
- State management
- Error handling

#### E2E Tests
- Complete admin workflows
- Provider verification process
- User management operations
- Analytics data display

## Security Considerations

### Authentication and Authorization
- Enhanced JWT tokens for admin users with shorter expiration
- Multi-factor authentication for admin accounts
- Role-based access control with granular permissions
- Session management with automatic logout

### Data Protection
- Audit logging for all admin actions
- Sensitive data masking in logs
- Encrypted storage for admin credentials
- Regular security audits

### API Security
- Rate limiting for admin endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Admin Account Security
- Strong password requirements
- Account lockout after failed attempts
- Regular password rotation reminders
- Secure admin account creation process

## Performance Considerations

### Database Optimization
- Indexed queries for admin operations
- Efficient pagination for large datasets
- Optimized joins for complex queries
- Database connection pooling

### Caching Strategy
- Redis caching for dashboard statistics
- Cached user and provider lists
- Session caching for admin users
- Cache invalidation on data updates

### Frontend Performance
- Lazy loading for admin components
- Virtualized lists for large datasets
- Optimized re-rendering with React.memo
- Code splitting for admin routes

### Monitoring and Analytics
- Performance monitoring for admin operations
- Database query performance tracking
- User experience metrics
- Error rate monitoring