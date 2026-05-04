# Study Tracker API Documentation

Base URL: `http://localhost:3000/api/v1`

---

## Authentication

All protected routes require a JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

### Register User

**POST** `/auth/register`

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "STUDENT" | "SUPERVISOR",
  "trackId": number
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "ahmed",
    "role": "STUDENT"
  }
}
```

---

### Login

**POST** `/auth/login`

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "ahmed",
      "fullName": "Ahmed ElKashif",
      "role": "STUDENT",
      "trackId": 1
    }
  }
}
```

---

## Study Entries (Requires Authentication + STUDENT role)

### Create Entry

**POST** `/entries`  
**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "subject": "string",
  "hours": number,
  "date": "YYYY-MM-DD",
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "entryId": 1,
    "subject": "React Native",
    "hours": "3.00",
    "date": "2026-04-25T00:00:00.000Z"
  }
}
```

---

### Get My Entries

**GET** `/entries/me`  
**Headers:** `Authorization: Bearer {token}`  
**Query:** `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` (optional)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subject": "React Native",
      "hours": "3.00",
      "date": "2026-04-25T00:00:00.000Z",
      "notes": "Built navigation system"
    }
  ],
  "meta": {
    "totalHours": "15.00",
    "totalEntries": 5
  }
}
```

---

### Update Entry

**PUT** `/entries/:entryId`  
**Headers:** `Authorization: Bearer {token}`

**Body:**
```json
{
  "hours": number,
  "notes": "string"
}
```

---

### Delete Entry

**DELETE** `/entries/:entryId`  
**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## Leaderboard (Requires Authentication)

### Daily Leaderboard

**GET** `/leaderboard/daily?date=YYYY-MM-DD&trackId=1`  
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-04-25T00:00:00.000Z",
    "rankings": [
      {
        "rank": 1,
        "userId": 1,
        "fullName": "Ahmed ElKashif",
        "totalHours": "5.00",
        "subjects": ["React Native", "TypeScript"]
      }
    ]
  }
}
```

---

### Weekly Leaderboard

**GET** `/leaderboard/weekly?weekStart=YYYY-MM-DD&trackId=1`  
**Headers:** `Authorization: Bearer {token}`

---

## Supervisor (Requires Authentication + SUPERVISOR role)

### Track Overview

**GET** `/supervisor/track-overview`  
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trackName": "ITP Front-End & Mobile Dev",
    "totalStudents": 5,
    "students": [
      {
        "userId": 1,
        "fullName": "Ahmed ElKashif",
        "username": "student1",
        "weeklyHours": "20.50",
        "monthlyHours": "80.00",
        "lastStudyDate": "2026-05-04T00:00:00.000Z"
      }
    ],
    "trackStats": {
      "averageWeeklyHours": "18.00",
      "mostStudiedSubject": "React Native"
    }
  }
}
```

---

### Student Details

**GET** `/supervisor/student/:userId`  
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "fullName": "Ahmed ElKashif",
      "username": "student1",
      "email": "student1@iti.com"
    },
    "entries": [...],
    "analytics": {
      "totalHours": "80.00",
      "totalEntries": 25,
      "subjectBreakdown": [
        { "subject": "React Native", "hours": "30.00" },
        { "subject": "TypeScript", "hours": "20.00" }
      ]
    }
  }
}
```

---

## Quotes (Requires Authentication)

### Daily Quote

**GET** `/quotes/daily`  
**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "quote": "First, solve the problem. Then, write the code.",
    "author": "John Johnson",
    "category": "programming"
  }
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message here"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request – Invalid input |
| 401 | Unauthorized – No/invalid token |
| 403 | Forbidden – Insufficient permissions |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Demo Credentials (after seeding)

| Role | Username | Password |
|------|----------|----------|
| Supervisor | supervisor1 | password123 |
| Student 1 | student1 | password123 |
| Student 2 | student2 | password123 |
| Student 3 | student3 | password123 |
| Student 4 | student4 | password123 |
| Student 5 | student5 | password123 |
