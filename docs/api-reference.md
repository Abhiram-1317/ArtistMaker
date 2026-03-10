# API Documentation

## Overview

Project Genesis exposes RESTful API endpoints through Next.js API routes and a Fastify backend server.

**Base URL:** `http://localhost:3000/api` (Next.js)  
**Backend URL:** `http://localhost:3001/api` (Fastify)

All API responses use JSON format.

---

## Authentication

Authentication is handled by NextAuth.js. Protected endpoints require a valid session cookie.

### POST /api/auth/signin
Sign in with credentials or OAuth provider.

### POST /api/auth/register
Create a new user account.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string (min 8 chars, requires number + special char + uppercase)"
}
```

**Response:** `201 Created`
```json
{
  "user": { "id": "string", "name": "string", "email": "string" }
}
```

---

## Projects

### GET /api/projects
List all projects for the authenticated user.

**Response:** `200 OK`
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "genre": "string",
      "status": "DRAFT | GENERATING | COMPLETED | FAILED",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
}
```

### POST /api/projects
Create a new project.

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "genre": "string",
  "style": "string",
  "settings": {
    "resolution": "1080p | 4K",
    "aspectRatio": "16:9 | 2.39:1",
    "duration": "number (minutes)"
  },
  "characters": [
    {
      "name": "string",
      "role": "string",
      "description": "string"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "string",
  "title": "string",
  "status": "DRAFT"
}
```

---

## Explore

### GET /api/explore
Get public movies feed.

**Query Parameters:**
| Parameter | Type   | Default | Description           |
|-----------|--------|---------|------------------------|
| page      | number | 1       | Page number            |
| limit     | number | 20      | Items per page         |
| genre     | string | —       | Filter by genre        |
| sort      | string | recent  | Sort: recent, popular, trending |

**Response:** `200 OK`
```json
{
  "movies": [...],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

---

## Watch

### GET /api/watch/[id]
Get movie details and playback information.

**Response:** `200 OK`
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "videoUrl": "string",
  "thumbnail": "string",
  "views": "number",
  "likes": "number",
  "creator": { "name": "string", "avatar": "string" },
  "comments": [...]
}
```

---

## Analytics

### GET /api/analytics
Get analytics data for the authenticated user.

**Response:** `200 OK`
```json
{
  "totalViews": "number",
  "totalLikes": "number",
  "totalMovies": "number",
  "viewsOverTime": [...],
  "topMovies": [...]
}
```

---

## Credits

### GET /api/credits
Get current credit balance and transaction history.

### POST /api/credits
Purchase additional credits.

**Body:**
```json
{
  "amount": "number",
  "paymentMethodId": "string"
}
```

---

## Profile

### GET /api/profile
Get current user profile.

### PUT /api/profile
Update user profile.

**Body:**
```json
{
  "name": "string",
  "bio": "string",
  "avatar": "string (URL)"
}
```

---

## Templates

### GET /api/templates
Get available project templates.

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "genre": "string",
      "thumbnail": "string",
      "config": {...}
    }
  ]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "string (error code)",
  "message": "string (human-readable message)"
}
```

| Status | Code             | Description              |
|--------|------------------|--------------------------|
| 400    | BAD_REQUEST      | Invalid request body     |
| 401    | UNAUTHORIZED     | Missing authentication   |
| 403    | FORBIDDEN        | Insufficient permissions |
| 404    | NOT_FOUND        | Resource not found       |
| 429    | RATE_LIMITED      | Too many requests        |
| 500    | INTERNAL_ERROR   | Server error             |

---

## Rate Limiting

API endpoints are rate-limited:
- **Authentication:** 5 requests per minute
- **Project creation:** 10 requests per minute
- **General API:** 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## WebSocket Events

Connect to the WebSocket server at `ws://localhost:3001` for real-time updates.

### Events (Server → Client)
| Event                | Payload                        |
|----------------------|--------------------------------|
| `render:progress`    | `{ projectId, progress, stage }` |
| `render:complete`    | `{ projectId, videoUrl }`       |
| `render:error`       | `{ projectId, error }`          |
| `collaboration:join` | `{ userId, projectId }`         |
| `collaboration:edit` | `{ userId, change }`            |
