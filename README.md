# LemonPay Backend API

A RESTful API built with Express.js, MongoDB (Mongoose), Redis caching, and JWT authentication.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Cache:** Redis (with LRU eviction policy)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Validation:** Joi

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```
MONGO_DB=mongodb://localhost:27017/lemonpay
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379
PORT=3000
```

### 3. Start the server

```bash
node index.js
```

---

## API Endpoints

### Auth

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "664f1a2b3c4d5e6f7a8b9c0d",
    "email": "user@example.com",
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errors:**
- `400` — Validation error (invalid email or password < 6 chars)
- `409` — Email already registered

---

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400` — Validation error
- `401` — Invalid email or password

---

### Tasks (Protected — requires Bearer token)

All task endpoints require the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

#### Get All Tasks

```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
[
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0e",
    "title": "My Task",
    "description": "Task description",
    "status": "pending",
    "userId": "664f1a2b3c4d5e6f7a8b9c0d",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

> Cached in Redis with key `tasks:{userId}` (TTL: 5 min)

---

#### Get Single Task

```bash
curl -X GET http://localhost:3000/api/tasks/<task_id> \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0e",
  "title": "My Task",
  "description": "Task description",
  "status": "pending",
  "userId": "664f1a2b3c4d5e6f7a8b9c0d",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors:**
- `404` — Task not found (or not owned by user)

> Cached in Redis with key `task:{taskId}` (TTL: 5 min)

---

#### Create Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "My Task",
    "description": "Task description",
    "status": "pending"
  }'
```

**Body fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | |
| description | string | Yes | |
| status | string | No | `pending` (default), `in-progress`, `completed` |

**Response (201):**
```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0e",
  "title": "My Task",
  "description": "Task description",
  "status": "pending",
  "userId": "664f1a2b3c4d5e6f7a8b9c0d",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

**Errors:**
- `400` — Validation error

> Invalidates `tasks:{userId}` cache

---

#### Update Task

```bash
curl -X PUT http://localhost:3000/api/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Updated Title",
    "status": "in-progress"
  }'
```

**Body fields (at least one required):**
| Field | Type | Required |
|-------|------|----------|
| title | string | No |
| description | string | No |
| status | string | No (`pending`, `in-progress`, `completed`) |

**Response (200):**
```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0e",
  "title": "Updated Title",
  "description": "Task description",
  "status": "in-progress",
  "userId": "664f1a2b3c4d5e6f7a8b9c0d",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T11:00:00.000Z"
}
```

**Errors:**
- `400` — Validation error (empty body or invalid status)
- `404` — Task not found (or not owned by user)

> Invalidates `tasks:{userId}` and `task:{taskId}` cache

---

#### Delete Task

```bash
curl -X DELETE http://localhost:3000/api/tasks/<task_id> \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Errors:**
- `404` — Task not found (or not owned by user)

> Invalidates `tasks:{userId}` and `task:{taskId}` cache

---

### Cache Management (Protected)

#### Clear Cache

Manually clears all Redis cache keys for the logged-in user (list cache + all individual task caches).

```bash
curl -X POST http://localhost:3000/api/clear-cache \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "message": "Cache cleared successfully"
}
```

---

## Project Structure

```
lemonpay-be/
├── config/
│   ├── mongodb.js          # Mongoose connection
│   └── redis.js            # Redis client + LRU config
├── controllers/
│   ├── auth.controller.js  # Register, Login
│   └── task.controller.js  # CRUD + cache logic
├── middleware/
│   ├── auth.js             # JWT verification
│   └── validate.js         # Joi validation middleware
├── models/
│   ├── user.js             # User model
│   └── task.js             # Task model
├── routes/
│   ├── auth.route.js       # /api/auth routes
│   ├── task.route.js       # /api/tasks routes
│   └── cache.route.js      # /api/clear-cache route
├── validators/
│   ├── auth.validator.js   # Register/Login schemas
│   └── task.validator.js   # Create/Update task schemas
├── index.js                # App entry point
├── package.json
└── .env
```

## Caching Strategy

- **GET /api/tasks** — cached with key `tasks:{userId}`, TTL 5 min
- **GET /api/tasks/:id** — cached with key `task:{taskId}`, TTL 5 min
- **Create/Update/Delete** — invalidates relevant cache keys
- **POST /api/clear-cache** — manually clears all user cache
- **Eviction policy** — `allkeys-lru` (least recently used keys evicted when memory is full)
