# Game Model API Documentation

## Overview

The Game Model API provides endpoints for managing sports games in the GameOn platform. This document outlines all available endpoints, their request/response structures, and usage examples.

---

## 📁 API Endpoint Tree Structure

```
/api/games
│
├── GET    /api/games                    # Get all games (with filters)
├── POST   /api/games                    # Create a new game
│
└── /api/games/[id]
    │
    ├── GET    /api/games/[id]           # Get a single game by ID
    ├── PATCH  /api/games/[id]           # Update a game (host only)
    ├── DELETE /api/games/[id]           # Delete a game (host only)
    │
    ├── POST   /api/games/[id]/join      # Join a game
    └── POST   /api/games/[id]/leave     # Leave a game
```

---

## 📋 Game Model Schema

```typescript
{
  _id: ObjectId,
  hostId: ObjectId (ref: 'User'),
  title: String (required),
  sport: String (required, enum: ['basketball', 'football', 'tennis', 'volleyball', 'badminton', 'pingpong', 'cricket']),
  description: String (required),
  location: {
    address: String (required),
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  date: Date (required),
  startTime: String (required), // Format: "HH:MM"
  endTime: String (required),    // Format: "HH:MM"
  maxPlayers: Number (required, min: 2),
  skillLevel: String (enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'all'),
  minSkillLevel: String,
  image: String (default: '/default-game.jpg'),
  hostWhatsApp: String,
  status: String (enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming'),
  registeredPlayers: [{
    userId: ObjectId (ref: 'User'),
    name: String,
    age: Number,
    skillLevel: String,
    image: String,
    whatsApp: String,
    joinedAt: Date
  }],
  teamBlue: [PlayerSchema],
  teamRed: [PlayerSchema],
  joinRequests: [{
    userId: ObjectId (ref: 'User'),
    name: String,
    age: Number,
    skillLevel: String,
    image: String,
    whatsApp: String,
    requestedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### 1. GET /api/games

**Description:** Retrieve all games with optional filtering and pagination.

**Authentication:** Not required (public endpoint)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sport` | string | No | Filter by sport type |
| `status` | string | No | Filter by status (upcoming, ongoing, completed, cancelled) |
| `city` | string | No | Filter by city (case-insensitive search) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Default Behavior:**
- If no `status` is provided, only shows `upcoming` and `ongoing` games
- Results are sorted by date (ascending) and startTime (ascending)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "hostId": "507f1f77bcf86cd799439012",
      "hostName": "John Doe",
      "title": "Friday Night Basketball",
      "sport": "basketball",
      "description": "Casual basketball game for all skill levels",
      "location": {
        "address": "Central Park",
        "city": "New York",
        "coordinates": {
          "lat": 40.785091,
          "lng": -73.968285
        }
      },
      "date": "2024-01-15T00:00:00.000Z",
      "startTime": "18:00",
      "endTime": "20:00",
      "maxPlayers": 10,
      "skillLevel": "all",
      "minSkillLevel": null,
      "image": "/default-game.jpg",
      "status": "upcoming",
      "hostWhatsApp": "+1234567890",
      "registeredPlayers": [
        {
          "id": "507f1f77bcf86cd799439013",
          "userId": "507f1f77bcf86cd799439014",
          "name": "Jane Smith",
          "age": 25,
          "skillLevel": "intermediate",
          "image": "/user-image.jpg",
          "whatsApp": "+1234567891",
          "joinedAt": "2024-01-10T10:00:00.000Z"
        }
      ],
      "teamBlue": [],
      "teamRed": [],
      "joinRequests": [],
      "seatsLeft": 9,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to fetch games"
}
```

---

### 2. POST /api/games

**Description:** Create a new game.

**Authentication:** Required (must be logged in)

**Request Body:**
```json
{
  "title": "Friday Night Basketball",
  "sport": "basketball",
  "description": "Casual basketball game for all skill levels",
  "location": {
    "address": "Central Park",
    "city": "New York",
    "coordinates": {
      "lat": 40.785091,
      "lng": -73.968285
    }
  },
  "date": "2024-01-15",
  "startTime": "18:00",
  "endTime": "20:00",
  "maxPlayers": 10,
  "skillLevel": "all",
  "minSkillLevel": "beginner",
  "image": "/custom-image.jpg",
  "hostWhatsApp": "+1234567890"
}
```

**Required Fields:**
- `title`
- `sport`
- `description`
- `location.address`
- `date` (ISO date string)
- `startTime`
- `endTime`
- `maxPlayers` (minimum: 2)

**Valid Sports:**
- `basketball`
- `football`
- `tennis`
- `volleyball`
- `badminton`
- `pingpong`
- `cricket`

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "hostId": "507f1f77bcf86cd799439012",
    "hostName": "John Doe",
    "title": "Friday Night Basketball",
    "sport": "basketball",
    "description": "Casual basketball game for all skill levels",
    "location": { ... },
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "20:00",
    "maxPlayers": 10,
    "skillLevel": "all",
    "status": "upcoming",
    "registeredPlayers": [],
    "teamBlue": [],
    "teamRed": [],
    "seatsLeft": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields, invalid sport, or maxPlayers < 2
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

---

### 3. GET /api/games/[id]

**Description:** Get a single game by its ID.

**Authentication:** Not required (public endpoint)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Game ID (MongoDB ObjectId) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "hostId": "507f1f77bcf86cd799439012",
    "hostName": "John Doe",
    "title": "Friday Night Basketball",
    "sport": "basketball",
    "description": "Casual basketball game for all skill levels",
    "location": { ... },
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "18:00",
    "endTime": "20:00",
    "maxPlayers": 10,
    "skillLevel": "all",
    "status": "upcoming",
    "registeredPlayers": [ ... ],
    "teamBlue": [ ... ],
    "teamRed": [ ... ],
    "joinRequests": [ ... ],
    "seatsLeft": 9,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID format
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

---

### 4. PATCH /api/games/[id]

**Description:** Update a game. Only the host can update their game.

**Authentication:** Required (must be the game host)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Game ID (MongoDB ObjectId) |

**Request Body:** (All fields are optional)
```json
{
  "title": "Updated Game Title",
  "sport": "football",
  "description": "Updated description",
  "location": {
    "address": "New Location",
    "city": "New York"
  },
  "date": "2024-01-20",
  "startTime": "19:00",
  "endTime": "21:00",
  "maxPlayers": 12,
  "skillLevel": "intermediate",
  "minSkillLevel": "beginner",
  "image": "/new-image.jpg",
  "hostWhatsApp": "+1234567890",
  "status": "ongoing"
}
```

**Validation Rules:**
- `sport`: Must be one of the valid sports
- `maxPlayers`: Must be at least 2, and cannot be less than current player count
- `skillLevel`: Must be one of: `beginner`, `intermediate`, `advanced`, `all`
- `status`: Must be one of: `upcoming`, `ongoing`, `completed`, `cancelled`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "hostId": "507f1f77bcf86cd799439012",
    "hostName": "John Doe",
    "title": "Updated Game Title",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or validation failed
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the game host
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

---

### 5. DELETE /api/games/[id]

**Description:** Delete a game. Only the host can delete their game.

**Authentication:** Required (must be the game host)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Game ID (MongoDB ObjectId) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Game deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID format
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not the game host
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

---

### 6. POST /api/games/[id]/join

**Description:** Join a game as a registered player.

**Authentication:** Required (must be logged in)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Game ID (MongoDB ObjectId) |

**Request Body:**
```json
{
  "name": "Jane Smith",
  "age": 25,
  "skillLevel": "intermediate",
  "image": "/user-image.jpg",
  "whatsApp": "+1234567891"
}
```

**Business Rules:**
- User cannot join if already registered
- User cannot join if game is full
- User cannot join if game status is `completed` or `cancelled`
- If game requires approval, user is added to `joinRequests` instead of `registeredPlayers`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully joined the game",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    ...
    "registeredPlayers": [ ... ],
    "seatsLeft": 8
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID, already registered, or game is full
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

---

### 7. POST /api/games/[id]/leave

**Description:** Leave a game (unregister from a game).

**Authentication:** Required (must be logged in and registered in the game)

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Game ID (MongoDB ObjectId) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully left the game",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    ...
    "registeredPlayers": [ ... ],
    "seatsLeft": 10
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid game ID or not registered in the game
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Game not found
- `500 Internal Server Error`: Server error

---

## 🔐 Authentication

Most endpoints require authentication. The authentication is handled via NextAuth.js session cookies. When making authenticated requests, the session is automatically included.

**Authentication Flow:**
1. User logs in via `/api/auth/signin`
2. Session cookie is set
3. Subsequent requests include the session automatically
4. `requireAuth()` middleware validates the session

---

## 📊 Response Format

All endpoints follow a consistent response format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": { ... }  // Only for list endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

---

## 🎯 Usage Examples

### Example 1: Fetch all basketball games
```bash
GET /api/games?sport=basketball&status=upcoming&page=1&limit=20
```

### Example 2: Create a new game
```bash
POST /api/games
Content-Type: application/json

{
  "title": "Weekend Football Match",
  "sport": "football",
  "description": "Friendly match for intermediate players",
  "location": {
    "address": "City Stadium",
    "city": "New York"
  },
  "date": "2024-01-20",
  "startTime": "14:00",
  "endTime": "16:00",
  "maxPlayers": 22,
  "skillLevel": "intermediate"
}
```

### Example 3: Update game details
```bash
PATCH /api/games/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "maxPlayers": 12,
  "status": "ongoing"
}
```

### Example 4: Join a game
```bash
POST /api/games/507f1f77bcf86cd799439011/join
Content-Type: application/json

{
  "name": "John Doe",
  "age": 28,
  "skillLevel": "advanced",
  "whatsApp": "+1234567890"
}
```

---

## 🗂️ File Structure

```
app/api/games/
├── route.ts                    # GET /api/games, POST /api/games
└── [id]/
    ├── route.ts                # GET /api/games/[id], PATCH /api/games/[id], DELETE /api/games/[id]
    ├── join/
    │   └── route.ts            # POST /api/games/[id]/join
    └── leave/
        └── route.ts             # POST /api/games/[id]/leave
```

---

## 📝 Notes

1. **Pagination**: The GET `/api/games` endpoint supports pagination with `page` and `limit` query parameters.

2. **Filtering**: Games can be filtered by `sport`, `status`, and `city`. By default, only `upcoming` and `ongoing` games are shown.

3. **Authorization**: 
   - Only the game host can update or delete their game
   - Users must be authenticated to create, join, or leave games
   - Public endpoints (GET) don't require authentication

4. **Data Transformation**: All responses transform MongoDB ObjectIds to strings and populate referenced user data.

5. **Validation**: All input data is validated before processing, with clear error messages returned for invalid inputs.

---

## 🔄 Status Flow

```
upcoming → ongoing → completed
    ↓
cancelled
```

- **upcoming**: Game is scheduled but hasn't started
- **ongoing**: Game is currently in progress
- **completed**: Game has finished
- **cancelled**: Game was cancelled by the host

---

## 🚀 Frontend Integration

The frontend uses the following files for API integration:

- **API Client**: `lib/api/games.ts` - Contains all API call functions
- **React Hooks**: `hooks/use-games.ts` - Custom hooks for fetching games
- **Components**: 
  - `components/dashboard/create-game-modal.tsx` - Game creation form
  - `components/dashboard/game-grid.tsx` - Games display
  - `components/dashboard/game-details-modal.tsx` - Game details view

---

## 📚 Related Documentation

- [User Model API](./user-model.md) - User management endpoints
- [Authentication API](./auth-model.md) - Authentication endpoints
- [Backend Integration Blueprint](../BACKEND_INTEGRATION_BLUEPRINT.md) - Overall API architecture

---

**Last Updated:** 2024-01-15  
**Version:** 1.0.0








