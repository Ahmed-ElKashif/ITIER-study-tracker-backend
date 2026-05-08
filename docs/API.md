# Study Tracker API — Phase 2 Documentation

**Base URL:** `http://localhost:3000/api/v1`  
**Auth:** JWT Bearer token (from `/auth/login`) — pass as `Authorization: Bearer <token>`

---

## What Changed in Phase 2

| Feature | Phase 1 | Phase 2 |
|---|---|---|
| Roles | STUDENT, SUPERVISOR | ADMIN, SUPERVISOR, STUDENT |
| Registration | Immediate ACTIVE | Defaults to PENDING_APPROVAL |
| Login gate | None | Blocks PENDING / SUSPENDED / ARCHIVED |
| Tracks | Static | Supervisor-created, capacity-enforced |
| Admin panel | None | Full CRUD over users, tracks, analytics |

---

## Architecture

```
Request → Router → Controller (HTTP) → Service (Business Logic) → Prisma → DB
```

Role hierarchy: `ADMIN > SUPERVISOR > STUDENT`

Student lifecycle: `PENDING_APPROVAL → ACTIVE` (approved) | `ARCHIVED` (rejected) | `SUSPENDED` (admin)

---

## Authentication

### POST /auth/register — Student Registration

> Public. Students only. Account starts as `PENDING_APPROVAL`.

**Request body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "trackId": 1
}
```

**201 Created:**
```json
{
  "success": true,
  "message": "Registration submitted successfully. Your account is pending supervisor approval.",
  "data": {
    "userId": 8,
    "username": "student1",
    "status": "PENDING_APPROVAL",
    "track": "ITP Front-End & Mobile Dev (9 months)"
  }
}
```

**Error responses:**
| Status | Error |
|---|---|
| 400 | All fields are required |
| 400 | Track not found |
| 400 | This track is not currently accepting registrations |
| 400 | Username or email already exists |
| 409 | Track is full (includes `maxStudents`, `currentCount`) |

---

### POST /auth/login

> Public. Blocks students who are not ACTIVE.

**Request body:**
```json
{ "username": "string", "password": "string" }
```

**200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "ahmed_admin",
      "fullName": "Ahmed ElKashif (Admin)",
      "role": "ADMIN",
      "status": "ACTIVE",
      "trackId": null,
      "track": null
    }
  }
}
```

**Error responses:**
| Status | Error | errorCode |
|---|---|---|
| 401 | Invalid credentials | — |
| 403 | Awaiting supervisor approval | `PENDING_APPROVAL` |
| 403 | Account suspended | `SUSPENDED` |
| 403 | Registration was not approved | `ARCHIVED` |

> **Frontend tip:** use `errorCode` to route to the correct screen (e.g. "Pending Approval" screen vs "Account Suspended" screen).

---

## Tracks

### GET /tracks — Active Tracks (Public, No Auth)

Used by students to pick a track during registration.

**200 OK:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "ITP Front-End & Mobile Dev (9 months)",
      "description": "...",
      "duration": "9 months",
      "maxStudents": 30,
      "currentStudents": 5,
      "supervisor": "Eng. Amira AbdelHady",
      "isFull": false
    }
  ]
}
```

---

### POST /tracks — Create Track `[SUPERVISOR]`

One track per supervisor. Creates track and links supervisor atomically.

**Request body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "duration": "string (optional)",
  "maxStudents": 30
}
```

**201 Created** — track object.  
**409 Conflict** — supervisor already owns a track (`trackId` of existing track returned).

---

### PUT /tracks/:trackId — Update Track `[SUPERVISOR]`

Partial update. Supervisor can only update their own track.

**Request body** (all optional):
```json
{
  "name": "string",
  "description": "string",
  "duration": "string",
  "maxStudents": 30,
  "isActive": true
}
```

---

### GET /tracks/me — My Track `[SUPERVISOR]`

Returns the supervisor's own track with live active student count.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "...",
    "activeStudents": 5,
    "isFull": false,
    "isActive": true
  }
}
```

---

## Supervisor Endpoints `[SUPERVISOR]`

### GET /supervisor/track-overview

Full track dashboard: student list with weekly/monthly hours and last study date.

---

### GET /supervisor/student/:userId

Individual student's entries, total hours, and subject breakdown.

---

### GET /supervisor/pending-students

Students in the supervisor's track awaiting approval (oldest first).

```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id": 4, "username": "pending1", "fullName": "Fatima Ahmed", "email": "...", "createdAt": "..." }
  ]
}
```

---

### POST /supervisor/students/:userId/approve

Sets student status to `ACTIVE`. Enforces track capacity before approving.

**200 OK:**
```json
{
  "success": true,
  "message": "Fatima Ahmed has been approved and can now log in",
  "data": { "id": 4, "fullName": "Fatima Ahmed", "status": "ACTIVE" }
}
```

**409 Conflict** — track is at full capacity.

---

### POST /supervisor/students/:userId/reject

Sets student status to `ARCHIVED` (preserves audit trail). Optionally accepts a `reason`.

**Request body:**
```json
{ "reason": "Incomplete application (optional)" }
```

---

## Admin Endpoints `[ADMIN]`

All admin routes require `role: ADMIN`.

---

### POST /admin/supervisors — Create Supervisor

Creates a supervisor account with a generated temporary password.

**Request body:**
```json
{ "email": "string", "fullName": "string" }
```

**201 Created:**
```json
{
  "success": true,
  "data": {
    "supervisor": { "id": 3, "username": "newsuper", "email": "...", "fullName": "...", "role": "SUPERVISOR" },
    "temporaryPassword": "SwiftBold42"
  }
}
```

> ⚠️ In production, `temporaryPassword` must be sent by email — never stored or logged.

---

### GET /admin/supervisors

All supervisors with their assigned track and member count.

---

### GET /admin/dashboard

System-wide counts, fired in parallel.

```json
{
  "success": true,
  "data": {
    "students": { "total": 7, "active": 5, "pending": 2, "suspended": 0 },
    "supervisors": { "total": 2 },
    "tracks": { "total": 3, "active": 3 },
    "studyActivity": { "totalHours": "245.5", "totalEntries": 118 }
  }
}
```

---

### GET /admin/analytics

- Top 10 students by total study hours
- Per-track active student counts
- Subject distribution (hours + entry count)

---

### GET /admin/tracks

All tracks with supervisor info and active student count.

---

### GET /admin/students

All students with filters, total hours and entry count per student.

**Query params:**
| Param | Example | Description |
|---|---|---|
| `status` | `?status=PENDING_APPROVAL` | Filter by StudentStatus enum |
| `trackId` | `?trackId=1` | Filter by track |
| `search` | `?search=ahmed` | Case-insensitive search on name, username, email |

---

### GET /admin/students/pending

Shortcut — all students awaiting approval across all tracks.

---

### PUT /admin/students/:userId/status — Update Student Status

Admin can suspend, reinstate, or archive any student.

**Request body:**
```json
{ "status": "SUSPENDED" }
```

Valid values: `PENDING_APPROVAL`, `ACTIVE`, `SUSPENDED`, `ARCHIVED`

---

### DELETE /admin/users/:userId — Delete User

Hard-deletes a user (study entries cascade-deleted). Admin accounts are protected.

**200 OK:**
```json
{ "success": true, "message": "User Fatima Ahmed deleted successfully" }
```

---

## Study Entries `[STUDENT]`

No changes from Phase 1.

| Method | Route | Description |
|---|---|---|
| POST | /entries | Create a study entry |
| GET | /entries/me | Get own entries (supports `?startDate` `?endDate`) |
| PUT | /entries/:entryId | Update an entry |
| DELETE | /entries/:entryId | Delete an entry |

---

## Leaderboard (Public)

| Method | Route | Required params |
|---|---|---|
| GET | /leaderboard/daily | `?date=YYYY-MM-DD&trackId=1` |
| GET | /leaderboard/weekly | `?weekStart=YYYY-MM-DD&trackId=1` |

---

## Error Format

All errors follow this shape:

```json
{
  "error": "Human-readable message",
  "errorCode": "MACHINE_READABLE_CODE (optional)",
  "maxStudents": 30,
  "currentCount": 30
}
```

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Bad request / validation error |
| 401 | Invalid credentials |
| 403 | Forbidden (wrong role or blocked account) |
| 404 | Resource not found |
| 409 | Conflict (duplicate / capacity exceeded) |
| 500 | Server error |
