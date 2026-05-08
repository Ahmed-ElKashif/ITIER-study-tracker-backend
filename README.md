# ITIER — Study Tracker for ITI Students

> **Phase 2** — Role-based backend with student approval workflow, admin panel, and track management.

Mobile-first study tracking platform for ITI students, supervisors, and administrators.

---

## What's New in Phase 2

| Feature | Description |
|---|---|
| 🔐 Role hierarchy | `ADMIN → SUPERVISOR → STUDENT` |
| ⏳ Approval workflow | Students register as `PENDING_APPROVAL` — supervisor must approve before login |
| 🎓 Track management | Supervisors create and manage their own tracks |
| 🛡️ Admin panel | Full CRUD over users, supervisors, tracks, and analytics |
| 🏗️ Service layer | All controllers decoupled into Controller + Service architecture |
| 🔒 Status-gated login | Pending / Suspended / Archived accounts blocked with specific `errorCode` |

---

## Features

### For Students
- 📝 Log daily study entries (subject, hours, notes)
- 📊 View study history with total statistics
- 🏆 Daily/weekly leaderboards (Codeforces-style)
- 💬 Daily motivational programming quotes
- 📈 Weekly and monthly progress tracking

### For Supervisors
- 👥 Monitor all active students in your track
- ⏳ Review and approve/reject pending registrations
- 📊 Track-level analytics (average hours, top subject)
- 🔍 View individual student details and subject breakdown

### For Admins
- ➕ Create supervisor accounts (auto-generated temp passwords)
- 📊 System dashboard (student/supervisor/track counts)
- 📈 Analytics — top students, subject distribution, track stats
- 🔧 Manage all students (filter, search, suspend, delete)

---

## Tech Stack

**Backend (API):**
- Node.js + Express 5 + TypeScript
- PostgreSQL (Supabase) + Prisma ORM
- JWT Authentication + bcrypt password hashing
- Controller / Service architecture

**Frontend (Mobile):**
- React Native 0.85 + TypeScript
- React Navigation (Stack + Bottom Tabs)
- React Hook Form + Yup validation
- Axios + AsyncStorage

---

## Prerequisites

- Node.js >= 22.11.0
- PostgreSQL database (Supabase / Railway / Local)
- React Native development environment
- **Expo Go** app installed on your physical device

---

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend folder
cd ITIER-Back-End

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# Apply Phase 2 migration
npx prisma migrate deploy
npx prisma generate

# Seed demo data (admin + supervisors + tracks + students)
npx prisma db seed

# Start dev server
npm run dev
# → Server running at http://localhost:3000
```

### 2. Mobile App (Expo)

```bash
cd StudyTracker
npm install
npx expo start
```

> **Note:** Update `API_BASE_URL` in `src/api/client.ts` with your PC's local IP (e.g. `192.168.1.5`) — not `localhost` — so the physical device can reach the backend.

### 3. Run Backend Tests

```bash
# Full test suite
npm test

# Phase 2 approval workflow E2E test only
npm test -- phase2-flow
```

---

## Demo Credentials (after seeding)

| Role | Username | Password |
|---|---|---|
| Admin | `ahmed_admin` | `admin123` |
| Supervisor | `amira_supervisor` | `supervisor123` |
| Supervisor | `hassan_supervisor` | `supervisor123` |
| Student | `student1` | `password123` |
| Student | `student2` | `password123` |

> Students registered **after** seeding will start as `PENDING_APPROVAL` — a supervisor must approve them before they can log in.

---

## Project Structure

```
ITIER-Back-End/
├── docs/
│   └── API.md                    ← Full Phase 2 API documentation
├── prisma/
│   ├── schema.prisma             ← Role, StudentStatus, Track models
│   ├── seed.ts                   ← Admin + supervisors + tracks + students
│   └── migrations/
├── src/
│   ├── controllers/              ← HTTP layer only (parse, validate, respond)
│   │   ├── auth.controller.ts
│   │   ├── entry.controller.ts
│   │   ├── supervisor.controller.ts
│   │   ├── track.controller.ts
│   │   └── admin.controller.ts
│   ├── services/                 ← Business logic + Prisma queries
│   │   ├── auth.service.ts
│   │   ├── entry.service.ts
│   │   ├── supervisor.service.ts
│   │   ├── track.service.ts
│   │   ├── admin.service.ts
│   │   ├── analytics.service.ts
│   │   └── quote.service.ts
│   ├── routes/                   ← Express routers with role middleware
│   ├── middleware/               ← authenticate + requireRole
│   ├── types/                    ← JWTPayload, RegisterRequest, etc.
│   └── app.ts
├── tests/
│   ├── auth.test.ts
│   ├── entries.test.ts
│   └── phase2-flow.test.ts       ← 12-step E2E approval workflow test
├── Study-Tracker-Phase2.postman_collection.json
└── vercel.json

StudyTracker/                     ← React Native App
├── src/
│   ├── api/                      ← Axios client & endpoints
│   ├── components/               ← Reusable UI components
│   ├── contexts/                 ← AuthContext (user session)
│   ├── navigation/               ← Stack & Tab navigators
│   ├── screens/
│   │   ├── auth/                 ← Login, Register (track selection)
│   │   ├── student/              ← Home, AddEntry, History, Leaderboard
│   │   └── supervisor/           ← Dashboard, PendingApprovals, Students
│   └── types/
└── App.tsx
```

---

## API Overview

Full documentation at [`docs/API.md`](./docs/API.md).

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Student registration (→ PENDING_APPROVAL) |
| POST | `/api/v1/auth/login` | Public | Login (blocks PENDING/SUSPENDED/ARCHIVED) |

### Tracks

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/tracks` | Public | Active tracks list for registration |
| POST | `/api/v1/tracks` | SUPERVISOR | Create track (1 per supervisor) |
| PUT | `/api/v1/tracks/:id` | SUPERVISOR | Update own track |
| GET | `/api/v1/tracks/me` | SUPERVISOR | Own track with live student count |

### Supervisor

| Method | Route | Description |
|---|---|---|
| GET | `/api/v1/supervisor/pending-students` | Students awaiting approval |
| POST | `/api/v1/supervisor/students/:id/approve` | Approve → ACTIVE |
| POST | `/api/v1/supervisor/students/:id/reject` | Reject → ARCHIVED |
| GET | `/api/v1/supervisor/track-overview` | Full track dashboard |

### Admin

| Method | Route | Description |
|---|---|---|
| POST | `/api/v1/admin/supervisors` | Create supervisor (temp password) |
| GET | `/api/v1/admin/dashboard` | System-wide counts |
| GET | `/api/v1/admin/analytics` | Top students, subject distribution |
| GET | `/api/v1/admin/students` | All students with filters + stats |
| PUT | `/api/v1/admin/students/:id/status` | Suspend / reinstate / archive |
| DELETE | `/api/v1/admin/users/:id` | Delete user |

---

## Postman Collection

Import `Study-Tracker-Phase2.postman_collection.json` into Postman.

The collection includes **13 tests** with automatic token/ID chaining via collection variables — run the entire flow with one click using **Collection Runner**.

---

## Git Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready, always deployable |
| `feature/phase2-backend` | Phase 2 backend (merged into main) |
| `feature/day-1-auth` | Phase 1 auth (archived) |
| `feature/day-2-core` | Phase 1 core (archived) |
| `feature/day-3-supervisor` | Phase 1 supervisor (archived) |

---

## Upcoming (Days 13-15)

- **Day 13** — React Native UI: track selection screen, pending approval screen, supervisor approval interface
- **Day 14** — Admin panel mobile UI, KPI dashboard for supervisors
- **Day 15** — Integration testing, deployment to Vercel

---

## License

MIT

## Author

Ahmed ElKashif  
ITP Front-End & Mobile Dev Track — ITI 2026
