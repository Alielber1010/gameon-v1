# GameOn Sports Website - Backend Integration Blueprint

## Project Overview
This document provides a complete blueprint for integrating the GameOn sports website frontend with a MongoDB database and JWT authentication system.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Environment Variables](#environment-variables)
7. [Backend File Structure](#backend-file-structure)
8. [Security Requirements](#security-requirements)
9. [Integration Points](#integration-points)
10. [Testing Strategy](#testing-strategy)

---

## 1. Technology Stack

### Required Backend Technologies
- **Runtime**: Node.js (v18+)
- **Framework**: Next.js 14 API Routes (already set up)
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Zod (already installed)
- **File Upload**: For profile pictures and game images

### Additional Packages Needed
```json
{
  "mongodb": "^6.3.0",
  "mongoose": "^8.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cookie": "^0.6.0"
}
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)                 │
│  - Pages & Components (Already Built)                        │
│  - Form Submissions                                          │
│  - API Calls via fetch()                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Routes (Next.js)                        │
│  /api/auth/*      - Authentication endpoints                 │
│  /api/games/*     - Game management endpoints                │
│  /api/users/*     - User profile endpoints                   │
│  /api/admin/*     - Admin dashboard endpoints                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Middleware Layer                            │
│  - JWT Verification                                          │
│  - Role-based Access Control                                 │
│  - Request Validation                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (MongoDB)                    │
│  - Users Collection                                          │
│  - Games Collection                                          │
│  - Reports Collection                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required, lowercase, trim),
  password: String (required, hashed with bcrypt),
  name: String (required),
  role: String (enum: ['user', 'admin'], default: 'user'),
  profilePicture: String (URL, optional),
  bio: String (optional),
  phoneNumber: String (optional),
  location: String (optional),
  
  // Email verification
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String (optional),
  emailVerificationExpires: Date (optional),
  
  // Password reset
  resetPasswordToken: String (optional),
  resetPasswordExpires: Date (optional),
  
  // Terms acceptance
  acceptedTerms: Boolean (default: false),
  acceptedTermsDate: Date (optional),
  
  // Social login (future)
  socialProviders: [{
    provider: String (enum: ['google', 'facebook']),
    providerId: String,
    connectedAt: Date
  }],
  
  // Timestamps
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now),
  lastLogin: Date (optional)
}

// Indexes
- email: unique
- role: 1
- createdAt: -1
```

### 3.2 Games Collection
```javascript
{
  _id: ObjectId,
  
  // Host information
  hostId: ObjectId (ref: 'Users', required),
  hostName: String (required),
  
  // Game details
  sport: String (required, enum: [
    'basketball', 'soccer', 'tennis', 'volleyball',
    'football', 'baseball', 'hockey', 'cricket',
    'badminton', 'golf', 'rugby', 'swimming'
  ]),
  title: String (required),
  description: String (required),
  
  // Location
  location: {
    address: String (required),
    city: String (required),
    state: String (optional),
    zipCode: String (optional),
    coordinates: {
      lat: Number (optional),
      lng: Number (optional)
    }
  },
  
  // Date and time
  date: Date (required),
  startTime: String (required, format: 'HH:mm'),
  endTime: String (required, format: 'HH:mm'),
  
  // Capacity
  maxPlayers: Number (required, min: 2),
  currentPlayers: Number (default: 0),
  registeredPlayers: [{
    userId: ObjectId (ref: 'Users'),
    userName: String,
    registeredAt: Date (default: Date.now)
  }],
  
  // Game settings
  skillLevel: String (enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'all'),
  isPublic: Boolean (default: true),
  allowWaitlist: Boolean (default: true),
  waitlist: [{
    userId: ObjectId (ref: 'Users'),
    userName: String,
    joinedAt: Date (default: Date.now)
  }],
  
  // Status
  status: String (enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming'),
  
  // Additional info
  equipment: [String] (optional),
  rules: String (optional),
  cost: Number (optional, min: 0),
  images: [String] (URLs, optional),
  
  // Timestamps
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now),
  cancelledAt: Date (optional),
  cancellationReason: String (optional)
}

// Indexes
- hostId: 1
- sport: 1
- date: -1
- status: 1
- location.city: 1
- createdAt: -1
- { sport: 1, date: 1, status: 1 } (compound index)
```

### 3.3 Reports Collection
```javascript
{
  _id: ObjectId,
  
  // Reporter information
  reporterId: ObjectId (ref: 'Users', required),
  reporterEmail: String (required),
  reporterName: String (required),
  
  // Report details
  type: String (enum: ['spam', 'inappropriate', 'harassment', 'fake', 'other'], required),
  category: String (enum: ['game', 'user', 'content'], required),
  
  // Target information
  targetId: ObjectId (required, ref to Games or Users),
  targetType: String (enum: ['game', 'user'], required),
  targetDetails: {
    title: String (optional, for games),
    name: String (optional, for users)
  },
  
  // Content
  description: String (required),
  priority: String (enum: ['low', 'medium', 'high', 'critical'], default: 'medium'),
  
  // Status tracking
  status: String (enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending'),
  adminNotes: String (optional),
  reviewedBy: ObjectId (ref: 'Users', optional),
  reviewedAt: Date (optional),
  resolution: String (optional),
  
  // Timestamps
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}

// Indexes
- reporterId: 1
- targetId: 1
- status: 1
- createdAt: -1
- { status: 1, priority: 1 } (compound index)
```

### 3.4 Admin Activity Logs Collection
```javascript
{
  _id: ObjectId,
  
  // Admin information
  adminId: ObjectId (ref: 'Users', required),
  adminEmail: String (required),
  adminName: String (required),
  
  // Action details
  action: String (required, enum: [
    'user_created', 'user_updated', 'user_deleted',
    'game_approved', 'game_deleted', 'game_featured',
    'report_reviewed', 'report_resolved',
    'settings_changed', 'bulk_action'
  ]),
  targetType: String (enum: ['user', 'game', 'report', 'system']),
  targetId: ObjectId (optional),
  
  // Details
  description: String (required),
  metadata: Object (optional, for storing additional data),
  ipAddress: String (optional),
  userAgent: String (optional),
  
  // Timestamps
  createdAt: Date (default: Date.now)
}

// Indexes
- adminId: 1
- action: 1
- createdAt: -1
- targetType: 1
```

---

## 4. API Endpoints

### 4.1 Authentication Endpoints

#### POST /api/auth/signup
**Purpose**: Register a new user

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "acceptedTerms": true
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Frontend Integration**: `app/signup/page.tsx` form submission

---

#### POST /api/auth/login
**Purpose**: Authenticate user and return JWT

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Set Cookie**: 
- Name: `auth_token`
- Value: JWT token
- HttpOnly: true
- Secure: true (in production)
- SameSite: strict
- Max-Age: 7 days

**Frontend Integration**: `app/login/page.tsx` form submission

---

#### POST /api/auth/logout
**Purpose**: Clear authentication token

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Clear Cookie**: Remove `auth_token` cookie

---

#### GET /api/auth/me
**Purpose**: Get current authenticated user

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "profilePicture": "/uploads/profile.jpg",
    "bio": "Love playing basketball!"
  }
}
```

**Frontend Integration**: Used in layout to check authentication status

---

#### POST /api/auth/forgot-password
**Purpose**: Send password reset email

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### POST /api/auth/reset-password
**Purpose**: Reset password with token

**Request Body**:
```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

#### POST /api/auth/verify-email
**Purpose**: Verify email address

**Request Body**:
```json
{
  "token": "verification_token_here"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### 4.2 Game Endpoints

#### GET /api/games
**Purpose**: Get all games with filters and pagination

**Query Parameters**:
- `sport`: Filter by sport (optional)
- `location`: Filter by location/city (optional)
- `date`: Filter by date (optional, format: YYYY-MM-DD)
- `skillLevel`: Filter by skill level (optional)
- `status`: Filter by status (default: 'upcoming')
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `search`: Search in title and description (optional)

**Response (200)**:
```json
{
  "success": true,
  "games": [
    {
      "id": "507f1f77bcf86cd799439011",
      "sport": "basketball",
      "title": "Evening Basketball Game",
      "description": "Casual game at the park",
      "location": {
        "address": "123 Main St",
        "city": "San Francisco",
        "coordinates": { "lat": 37.7749, "lng": -122.4194 }
      },
      "date": "2025-01-15T00:00:00.000Z",
      "startTime": "18:00",
      "endTime": "20:00",
      "maxPlayers": 10,
      "currentPlayers": 7,
      "skillLevel": "intermediate",
      "host": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe"
      },
      "status": "upcoming",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 12
  }
}
```

**Frontend Integration**: `app/upcoming-games/page.tsx`

---

#### GET /api/games/:id
**Purpose**: Get single game details

**Response (200)**:
```json
{
  "success": true,
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "sport": "basketball",
    "title": "Evening Basketball Game",
    "description": "Casual game at the park",
    "location": {
      "address": "123 Main St",
      "city": "San Francisco",
      "coordinates": { "lat": 37.7749, "lng": -122.4194 }
    },
    "date": "2025-01-15T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "20:00",
    "maxPlayers": 10,
    "currentPlayers": 7,
    "registeredPlayers": [
      {
        "userId": "507f1f77bcf86cd799439012",
        "userName": "Jane Smith",
        "registeredAt": "2025-01-02T10:00:00.000Z"
      }
    ],
    "skillLevel": "intermediate",
    "equipment": ["Basketball", "Water bottles"],
    "rules": "Be respectful and have fun!",
    "cost": 0,
    "host": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "profilePicture": "/uploads/profile.jpg"
    },
    "status": "upcoming",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Frontend Integration**: `app/upcoming-games/[id]/page.tsx`

---

#### POST /api/games
**Purpose**: Create a new game (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "sport": "basketball",
  "title": "Evening Basketball Game",
  "description": "Casual game at the park",
  "location": {
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94103"
  },
  "date": "2025-01-15",
  "startTime": "18:00",
  "endTime": "20:00",
  "maxPlayers": 10,
  "skillLevel": "intermediate",
  "isPublic": true,
  "equipment": ["Basketball", "Water bottles"],
  "rules": "Be respectful and have fun!",
  "cost": 0
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Game created successfully",
  "game": {
    "id": "507f1f77bcf86cd799439011",
    "sport": "basketball",
    "title": "Evening Basketball Game",
    ...
  }
}
```

**Frontend Integration**: `app/host-game/page.tsx` form submission

---

#### PUT /api/games/:id
**Purpose**: Update game (Requires authentication, must be host or admin)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**: (Same as POST, all fields optional)

**Response (200)**:
```json
{
  "success": true,
  "message": "Game updated successfully",
  "game": { ... }
}
```

**Frontend Integration**: `app/manage-games/page.tsx` edit functionality

---

#### DELETE /api/games/:id
**Purpose**: Delete/Cancel game (Requires authentication, must be host or admin)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Game deleted successfully"
}
```

---

#### POST /api/games/:id/register
**Purpose**: Register for a game (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Successfully registered for the game",
  "game": { ... }
}
```

**Frontend Integration**: `app/upcoming-games/[id]/page.tsx` register button

---

#### POST /api/games/:id/unregister
**Purpose**: Unregister from a game (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Successfully unregistered from the game"
}
```

---

#### GET /api/games/user/hosted
**Purpose**: Get games hosted by current user (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200)**:
```json
{
  "success": true,
  "games": [ ... ],
  "pagination": { ... }
}
```

**Frontend Integration**: `app/manage-games/page.tsx`

---

#### GET /api/games/user/registered
**Purpose**: Get games user is registered for (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "games": [ ... ]
}
```

---

### 4.3 User/Profile Endpoints

#### GET /api/users/profile
**Purpose**: Get current user profile (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": "/uploads/profile.jpg",
    "bio": "Love playing basketball!",
    "phoneNumber": "+1234567890",
    "location": "San Francisco, CA",
    "isEmailVerified": true,
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Frontend Integration**: `app/profile/page.tsx`

---

#### PUT /api/users/profile
**Purpose**: Update user profile (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "name": "John Doe",
  "bio": "Updated bio",
  "phoneNumber": "+1234567890",
  "location": "San Francisco, CA"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

#### POST /api/users/profile/picture
**Purpose**: Upload profile picture (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body**: FormData with `profilePicture` file

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "profilePicture": "/uploads/profile_507f1f77bcf86cd799439011.jpg"
}
```

---

### 4.4 Report Endpoints

#### POST /api/reports
**Purpose**: Submit a report (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "type": "inappropriate",
  "category": "game",
  "targetId": "507f1f77bcf86cd799439011",
  "targetType": "game",
  "description": "This game contains inappropriate content",
  "priority": "medium"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "report": {
    "id": "507f1f77bcf86cd799439020",
    "status": "pending"
  }
}
```

**Frontend Integration**: `app/report/page.tsx` form submission

---

#### GET /api/reports/user
**Purpose**: Get current user's reports (Requires authentication)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "reports": [ ... ]
}
```

---

### 4.5 Admin Endpoints

#### GET /api/admin/users
**Purpose**: Get all users (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name or email (optional)
- `role`: Filter by role (optional)

**Response (200)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isEmailVerified": true,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "lastLogin": "2025-01-10T15:30:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

**Frontend Integration**: `app/admin/users/page.tsx`

---

#### PUT /api/admin/users/:id
**Purpose**: Update user (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "name": "Updated Name",
  "role": "admin",
  "isEmailVerified": true
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": { ... }
}
```

---

#### DELETE /api/admin/users/:id
**Purpose**: Delete user (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

#### GET /api/admin/reports
**Purpose**: Get all reports (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `status`: Filter by status (optional)
- `priority`: Filter by priority (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200)**:
```json
{
  "success": true,
  "reports": [ ... ],
  "pagination": { ... }
}
```

**Frontend Integration**: `app/admin/reports/page.tsx`

---

#### PUT /api/admin/reports/:id
**Purpose**: Update report status (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "status": "resolved",
  "adminNotes": "Issue has been addressed",
  "resolution": "User warned and content removed"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Report updated successfully",
  "report": { ... }
}
```

---

#### GET /api/admin/analytics
**Purpose**: Get dashboard analytics (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Response (200)**:
```json
{
  "success": true,
  "analytics": {
    "totalUsers": 1250,
    "totalGames": 450,
    "activeGames": 120,
    "pendingReports": 8,
    "newUsersThisWeek": 45,
    "gamesCreatedThisWeek": 32,
    "userGrowth": [
      { "date": "2025-01-01", "count": 1000 },
      { "date": "2025-01-08", "count": 1100 }
    ],
    "gamesBySport": [
      { "sport": "basketball", "count": 150 },
      { "sport": "soccer", "count": 120 }
    ]
  }
}
```

**Frontend Integration**: `app/admin/analytics/page.tsx`

---

#### GET /api/admin/activity-logs
**Purpose**: Get admin activity logs (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `action`: Filter by action type (optional)

**Response (200)**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "507f1f77bcf86cd799439030",
      "adminName": "Admin User",
      "action": "user_deleted",
      "description": "Deleted user John Doe",
      "createdAt": "2025-01-10T15:30:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

**Frontend Integration**: `app/admin/activity-logs/page.tsx`

---

#### POST /api/admin/bulk-actions
**Purpose**: Perform bulk actions (Requires admin role)

**Headers**: 
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "action": "delete",
  "targetType": "users",
  "targetIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Bulk action completed successfully",
  "affectedCount": 2
}
```

---

## 5. Authentication Flow

### 5.1 JWT Token Structure
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "role": "user",
  "iat": 1704067200,  // Issued at
  "exp": 1704672000   // Expires (7 days)
}
```

### 5.2 Token Generation
```javascript
// lib/auth.js
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET // Must be strong and secure

export function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
```

### 5.3 Token Verification Middleware
```javascript
// lib/middleware/auth.js
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function verifyToken(request) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth_token')?.value
    
    if (!token) {
      return { 
        error: 'Authentication required',
        status: 401 
      }
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    return { 
      user: decoded,
      userId: decoded.userId,
      role: decoded.role
    }
  } catch (error) {
    return { 
      error: 'Invalid or expired token',
      status: 401 
    }
  }
}

export async function requireAuth(request) {
  const result = await verifyToken(request)
  
  if (result.error) {
    return NextResponse.json(
      { success: false, message: result.error },
      { status: result.status }
    )
  }
  
  return result
}

export async function requireAdmin(request) {
  const result = await requireAuth(request)
  
  if (result instanceof NextResponse) {
    return result // Error response
  }
  
  if (result.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    )
  }
  
  return result
}
```

### 5.4 Password Hashing
```javascript
// lib/auth.js
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}
```

### 5.5 Frontend Authentication Flow

```javascript
// lib/auth-context.tsx (Already exists, needs backend integration)

// On login success:
// 1. Store token in localStorage or cookie
// 2. Set user in context
// 3. Redirect to dashboard/home

// On every API request:
// 1. Get token from storage
// 2. Add to Authorization header
// 3. Handle 401 errors by redirecting to login

// Example fetch with auth:
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('auth_token')
    window.location.href = '/login'
    return
  }
  
  return response
}
```

---

## 6. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gameon?retryWrites=true&w=majority
MONGODB_DB_NAME=gameon

# JWT Secret (Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email Service (for verification and password reset)
EMAIL_SERVICE=sendgrid  # or 'resend', 'nodemailer'
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@gameon.com
EMAIL_FROM_NAME=GameOn Sports

# File Upload
UPLOAD_MAX_SIZE=5242880  # 5MB in bytes
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,image/gif

# Admin Email (first admin user)
ADMIN_EMAIL=admin@gameon.com

# Security
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Rate Limiting (optional)
RATE_LIMIT_MAX=100  # requests per window
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms

# Node Environment
NODE_ENV=development  # or 'production'
```

### Environment Variable Validation
```javascript
// lib/env.js
export function validateEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
}
```

---

## 7. Backend File Structure

```
project-root/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   ├── me/
│   │   │   │   └── route.ts
│   │   │   ├── forgot-password/
│   │   │   │   └── route.ts
│   │   │   ├── reset-password/
│   │   │   │   └── route.ts
│   │   │   └── verify-email/
│   │   │       └── route.ts
│   │   │
│   │   ├── games/
│   │   │   ├── route.ts                    # GET all, POST create
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts                # GET one, PUT update, DELETE
│   │   │   │   ├── register/
│   │   │   │   │   └── route.ts
│   │   │   │   └── unregister/
│   │   │   │       └── route.ts
│   │   │   └── user/
│   │   │       ├── hosted/
│   │   │       │   └── route.ts
│   │   │       └── registered/
│   │   │           └── route.ts
│   │   │
│   │   ├── users/
│   │   │   └── profile/
│   │   │       ├── route.ts                # GET, PUT
│   │   │       └── picture/
│   │   │           └── route.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── route.ts                    # POST create
│   │   │   └── user/
│   │   │       └── route.ts                # GET user's reports
│   │   │
│   │   └── admin/
│   │       ├── users/
│   │       │   ├── route.ts                # GET all
│   │       │   └── [id]/
│   │       │       └── route.ts            # PUT, DELETE
│   │       ├── reports/
│   │       │   ├── route.ts                # GET all
│   │       │   └── [id]/
│   │       │       └── route.ts            # PUT
│   │       ├── analytics/
│   │       │   └── route.ts
│   │       ├── activity-logs/
│   │       │   └── route.ts
│   │       └── bulk-actions/
│   │           └── route.ts
│   │
│   └── [frontend pages already built]
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts                      # MongoDB connection
│   │   └── models/
│   │       ├── User.ts                     # User model
│   │       ├── Game.ts                     # Game model
│   │       ├── Report.ts                   # Report model
│   │       └── ActivityLog.ts              # Activity log model
│   │
│   ├── middleware/
│   │   ├── auth.ts                         # Auth middleware
│   │   ├── validation.ts                   # Request validation
│   │   └── rate-limit.ts                   # Rate limiting
│   │
│   ├── utils/
│   │   ├── auth.ts                         # Auth utilities (hash, JWT)
│   │   ├── email.ts                        # Email sending
│   │   ├── upload.ts                       # File upload handling
│   │   ├── validation.ts                   # Validation schemas (Zod)
│   │   └── logger.ts                       # Logging utility
│   │
│   └── env.ts                              # Environment validation
│
├── public/
│   └── uploads/                            # User uploaded files
│       ├── profiles/
│       └── games/
│
└── .env.local                              # Environment variables
```

---

## 8. Security Requirements

### 8.1 Password Security
- **Minimum length**: 8 characters
- **Must include**: 
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Hashing**: Use bcrypt with 10 rounds
- **No common passwords**: Check against common password list

### 8.2 JWT Security
- **Secret key**: Minimum 32 characters, stored in environment variable
- **Expiration**: 7 days default
- **Storage**: HttpOnly cookies (preferred) or localStorage
- **Refresh**: Implement refresh token rotation (optional, but recommended)

### 8.3 API Security
- **Rate limiting**: Implement rate limiting on all endpoints
  - Auth endpoints: 5 requests per 15 minutes
  - Other endpoints: 100 requests per 15 minutes
- **Input validation**: Validate all inputs with Zod schemas
- **SQL injection**: Use parameterized queries (Mongoose handles this)
- **XSS protection**: Sanitize user inputs, especially in reports
- **CORS**: Configure CORS properly for production

### 8.4 File Upload Security
- **Size limit**: Maximum 5MB per file
- **Allowed types**: JPEG, PNG, WebP, GIF only
- **File validation**: Verify file type by magic numbers, not extension
- **Filename sanitization**: Generate random filenames to prevent overwrites
- **Storage**: Store outside public directory or use cloud storage (AWS S3, Cloudinary)

### 8.5 Database Security
- **Connection**: Use connection string with authentication
- **Indexes**: Add indexes for frequently queried fields
- **Backup**: Implement regular backups
- **Sensitive data**: Never log passwords or tokens

### 8.6 HTTPS
- **Production**: Always use HTTPS in production
- **Secure cookies**: Set `secure: true` for cookies in production
- **HSTS**: Implement HTTP Strict Transport Security headers

---

## 9. Integration Points

### 9.1 Frontend Components That Need Backend Integration

#### Authentication Pages
- `app/login/page.tsx`
  - Form submits to: `POST /api/auth/login`
  - On success: Store token, redirect to `/upcoming-games`
  - On error: Display error message

- `app/signup/page.tsx`
  - Form submits to: `POST /api/auth/signup`
  - On success: Show verification message, redirect to `/login`
  - On error: Display error message

- `app/forgot-password/page.tsx`
  - Form submits to: `POST /api/auth/forgot-password`
  - On success: Show success message

#### Profile Page
- `app/profile/page.tsx`
  - Loads data from: `GET /api/users/profile`
  - Updates via: `PUT /api/users/profile`
  - Profile picture: `POST /api/users/profile/picture`

#### Game Pages
- `app/upcoming-games/page.tsx`
  - Loads games: `GET /api/games?status=upcoming`
  - Filters: Update query parameters

- `app/upcoming-games/[id]/page.tsx`
  - Loads game: `GET /api/games/:id`
  - Register: `POST /api/games/:id/register`
  - Unregister: `POST /api/games/:id/unregister`

- `app/host-game/page.tsx`
  - Creates game: `POST /api/games`
  - On success: Redirect to `/manage-games`

- `app/manage-games/page.tsx`
  - Loads hosted games: `GET /api/games/user/hosted`
  - Edit game: `PUT /api/games/:id`
  - Delete game: `DELETE /api/games/:id`

#### Report Page
- `app/report/page.tsx`
  - Submits report: `POST /api/reports`
  - On success: Show confirmation

#### Admin Pages
- `app/admin/users/page.tsx`
  - Loads users: `GET /api/admin/users`
  - Update user: `PUT /api/admin/users/:id`
  - Delete user: `DELETE /api/admin/users/:id`

- `app/admin/reports/page.tsx`
  - Loads reports: `GET /api/admin/reports`
  - Update report: `PUT /api/admin/reports/:id`

- `app/admin/analytics/page.tsx`
  - Loads analytics: `GET /api/admin/analytics`

- `app/admin/activity-logs/page.tsx`
  - Loads logs: `GET /api/admin/activity-logs`

### 9.2 Authentication Context Integration

The frontend already has an authentication context at `lib/auth-context.tsx`. Update it to:

```typescript
// lib/auth-context.tsx updates needed

// 1. Add API calls for login/logout
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed')
  }
  
  // Store token
  localStorage.setItem('auth_token', data.token)
  
  // Update context
  setUser(data.user)
  setIsAuthenticated(true)
  
  return data
}

// 2. Add function to check auth on mount
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      setUser(data.user)
      setIsAuthenticated(true)
    }
  } catch (error) {
    // Not authenticated
    setIsAuthenticated(false)
  }
}

// 3. Add logout function
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  })
  
  localStorage.removeItem('auth_token')
  setUser(null)
  setIsAuthenticated(false)
}
```

### 9.3 Protected Routes

Add middleware to check authentication:

```typescript
// middleware.ts (create this file)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/profile',
  '/host-game',
  '/manage-games',
  '/admin'
]

const adminPaths = ['/admin']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl
  
  // Check if path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtected && !token) {
    // Redirect to login
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  // Check admin paths
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  
  if (isAdminPath) {
    // Verify admin role (you'll need to decode JWT)
    // For now, just check token exists
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/host-game/:path*',
    '/manage-games/:path*',
    '/admin/:path*'
  ]
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
- **Models**: Test model methods and validations
- **Utilities**: Test auth utilities (hashing, JWT)
- **Validation**: Test Zod schemas

### 10.2 Integration Tests
- **API Endpoints**: Test each endpoint with different scenarios
  - Success cases
  - Error cases (invalid data, unauthorized, etc.)
  - Edge cases
- **Authentication Flow**: Test complete login/logout flow
- **Database Operations**: Test CRUD operations

### 10.3 Tools
- **Jest**: Unit testing framework
- **Supertest**: API endpoint testing
- **MongoDB Memory Server**: In-memory database for tests

### 10.4 Test Coverage Goals
- **Minimum**: 70% code coverage
- **Critical paths**: 90%+ coverage (auth, payments, user data)

---

## 11. Implementation Steps

### Phase 1: Database Setup (Week 1)
1. Set up MongoDB Atlas account or local MongoDB
2. Create database and collections
3. Set up connection in `lib/db/mongodb.ts`
4. Create Mongoose models
5. Test database connection

### Phase 2: Authentication (Week 1-2)
1. Implement JWT utilities
2. Create auth API endpoints
3. Add password hashing
4. Test authentication flow
5. Integrate with frontend login/signup

### Phase 3: Game Management (Week 2-3)
1. Create game API endpoints
2. Implement game CRUD operations
3. Add registration/unregistration
4. Integrate with frontend pages
5. Test game workflows

### Phase 4: User Profiles (Week 3)
1. Create user profile endpoints
2. Implement profile picture upload
3. Add profile editing
4. Integrate with frontend

### Phase 5: Reports System (Week 4)
1. Create report endpoints
2. Add report validation
3. Integrate with frontend

### Phase 6: Admin Features (Week 4-5)
1. Create admin endpoints
2. Add role-based access control
3. Implement analytics
4. Add activity logging
5. Integrate with admin dashboard

### Phase 7: Email & Notifications (Week 5)
1. Set up email service
2. Add email verification
3. Add password reset emails
4. Add notification system (optional)

### Phase 8: Security Hardening (Week 6)
1. Add rate limiting
2. Implement CORS
3. Add input sanitization
4. Security audit
5. Add logging

### Phase 9: Testing (Week 6-7)
1. Write unit tests
2. Write integration tests
3. Test all user flows
4. Fix bugs

### Phase 10: Deployment (Week 7)
1. Set up production database
2. Configure environment variables
3. Deploy to Vercel
4. Test production environment
5. Monitor for issues

---

## 12. API Response Standards

All API responses should follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 13. Error Codes

Standardized error codes for frontend handling:

```javascript
const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_EMAIL_EXISTS: 'Email already registered',
  AUTH_TOKEN_EXPIRED: 'Session expired, please login again',
  AUTH_TOKEN_INVALID: 'Invalid authentication token',
  AUTH_UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Validation
  VALIDATION_FAILED: 'Validation failed',
  VALIDATION_REQUIRED_FIELD: 'Required field missing',
  VALIDATION_INVALID_EMAIL: 'Invalid email format',
  VALIDATION_PASSWORD_WEAK: 'Password does not meet requirements',
  
  // Resources
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  RESOURCE_CONFLICT: 'Resource conflict',
  
  // Game specific
  GAME_FULL: 'Game is already full',
  GAME_ALREADY_REGISTERED: 'Already registered for this game',
  GAME_NOT_REGISTERED: 'Not registered for this game',
  GAME_PAST_DATE: 'Cannot register for past games',
  
  // Server
  SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
}
```

---

## 14. Monitoring & Logging

### Logging Strategy
```javascript
// lib/utils/logger.ts
export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },
  
  error: (message, error = {}, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}
```

### What to Log
- **API requests**: Endpoint, method, user ID, response time
- **Errors**: All errors with stack traces
- **Auth events**: Login, logout, failed attempts
- **Admin actions**: All admin operations
- **Database operations**: Slow queries, connection issues

---

## 15. Performance Optimization

### Database Optimization
- **Indexes**: Add indexes on frequently queried fields
- **Pagination**: Always paginate large result sets
- **Projection**: Only select needed fields
- **Connection pooling**: Configure proper pool size

### API Optimization
- **Caching**: Implement caching for frequently accessed data
- **Response compression**: Enable gzip compression
- **Lazy loading**: Load data on demand
- **Batch operations**: Support bulk operations for admin

### Frontend Optimization
- **Debouncing**: Debounce search inputs
- **Infinite scroll**: Use for game listings
- **Image optimization**: Use Next.js Image component
- **Code splitting**: Already handled by Next.js

---

## 16. Deployment Checklist

### Pre-deployment
- [ ] All environment variables configured in production
- [ ] Database backup strategy in place
- [ ] Error tracking configured (Sentry, LogRocket)
- [ ] SSL certificate configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Email service configured and tested
- [ ] File upload storage configured (S3, Cloudinary)

### Post-deployment
- [ ] Test all critical user flows
- [ ] Verify email delivery
- [ ] Check database connections
- [ ] Monitor error rates
- [ ] Test authentication
- [ ] Verify admin access
- [ ] Check API response times
- [ ] Test on multiple devices/browsers

---

## 17. Contact & Support

For any questions or clarifications about this blueprint:

1. Review the API documentation carefully
2. Check the database schema matches your needs
3. Ensure all environment variables are set
4. Test each endpoint as you build it
5. Use the provided error codes consistently
6. Follow the security guidelines strictly

---

## Quick Start Commands

```bash
# Install backend dependencies
npm install mongodb mongoose bcryptjs jsonwebtoken cookie

# Install dev dependencies
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cookie

# Create .env.local file and add environment variables

# Test database connection
# Create lib/db/test-connection.ts and run:
npx tsx lib/db/test-connection.ts

# Start development server
npm run dev

# The API will be available at:
# http://localhost:3000/api
```

---

## Example Code Snippets

### MongoDB Connection
```typescript
// lib/db/mongodb.ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB
```

### User Model
```typescript
// lib/db/models/User.ts
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: String,
  bio: String,
  phoneNumber: String,
  location: String,
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  acceptedTerms: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for faster queries
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
```

### Example API Route
```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { comparePassword, generateToken } from '@/lib/utils/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email, password } = await request.json()
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Check password
    const isValid = await comparePassword(password, user.password)
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Generate token
    const token = generateToken(user)
    
    // Update last login
    user.lastLogin = new Date()
    await user.save()
    
    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    })
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

**End of Blueprint**

This document provides everything needed to build a fully functional backend for the GameOn sports website. Follow the implementation phases, use the provided examples, and maintain consistent error handling and security practices throughout.
