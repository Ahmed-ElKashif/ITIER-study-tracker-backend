<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=32&pause=1000&color=E63946&center=true&vCenter=true&width=600&lines=ITIER+Study+Tracker;Built+for+ITI+Students+%F0%9F%8E%93;Phase+2+%E2%80%94+Role-Based+Backend" alt="Typing SVG" />

<br/>

<p>
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
</p>

<p>
  <img src="https://img.shields.io/badge/React_Native-0.85-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Expo-SDK_52-000020?style=for-the-badge&logo=expo&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-Auth-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Phase-2_Complete-28A745?style=for-the-badge"/>
</p>

<br/>

> **A production-grade study tracking platform built for ITI students, supervisors, and administrators.**  
> Role-based access · Approval workflows · Real-time analytics · Mobile-first design

<br/>

[![API Docs](https://img.shields.io/badge/📖_API_Docs-docs/API.md-blue?style=flat-square)](./docs/API.md)
[![Postman](https://img.shields.io/badge/🧪_Postman_Collection-Import_Ready-orange?style=flat-square)](./Study-Tracker-Phase2.postman_collection.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](./LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [What's New in Phase 2](#-whats-new-in-phase-2)
- [Architecture](#-architecture)
- [Features by Role](#-features-by-role)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Overview](#-api-overview)
- [Demo Credentials](#-demo-credentials)
- [Testing](#-testing)
- [Student Lifecycle](#-student-lifecycle)
- [Postman Collection](#-postman-collection)
- [Git Branch Strategy](#-git-branch-strategy)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🎯 Overview

**ITIER** is a full-stack study tracking system designed specifically for **ITI (Information Technology Institute)** students enrolled in the ITP (Intensive Training Program).

It solves a real problem: supervisors had no structured way to monitor, approve, or analyze student progress across multiple training tracks. ITIER provides a role-gated, approval-based platform where every interaction — from registration to daily study logging — is tracked, validated, and analyzed.

```
Student registers → PENDING ─── Supervisor approves ──→ ACTIVE → Logs study entries
                             └── Supervisor rejects ──→ ARCHIVED
```

---

## 🚀 What's New in Phase 2

| # | Feature | Details |
|---|---|---|
| 1 | 🔐 **Role Hierarchy** | `ADMIN → SUPERVISOR → STUDENT` — enforced at route level via middleware |
| 2 | ⏳ **Approval Workflow** | Students start as `PENDING_APPROVAL` and cannot log in until approved |
| 3 | 🎓 **Track Management** | Supervisors create & manage their own tracks (one per supervisor, atomic transaction) |
| 4 | 🛡️ **Admin Panel** | Full CRUD: supervisors, students, analytics, system dashboard |
| 5 | 🏗️ **Service Architecture** | Controllers decoupled into `Controller (HTTP) → Service (Business Logic)` layers |
| 6 | 🔒 **Status-Gated Login** | Blocked accounts return specific `errorCode` for React Native screen routing |
| 7 | 📊 **Parallel Analytics** | Dashboard stats fetched with `Promise.all` — zero sequential query overhead |
| 8 | 🔢 **Capacity Enforcement** | Track `maxStudents` validated on both register and approve |
| 9 | 📝 **Structured Logging** | `Winston` implemented across all controllers, generating `combined.log` and `error.log` for production observability |
| 10 | 🛡️ **Security Hardening** | Added `Helmet` (headers), `HPP` (parameter pollution), and `Express-Rate-Limit` for brute-force protection |
| 11 | ✅ **Zod Validation** | Strict schema validation bound to all endpoints to reject invalid request payloads instantly |
| 12 | 🧪 **Unit Testing** | Reached 100% pass rate (36 tests) with idempotent E2E flows and mocked controller unit tests |
| 13 | ☁️ **Supabase Direct** | Removed Vercel configuration artifacts in favor of a direct, persistent local/Supabase environment |

---

## 🏛️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────┐
│   Request   │───▶│   Router     │───▶│   Controller     │───▶│ Service  │
│  (Express)  │    │ + Middleware │    │  (HTTP Layer)    │    │ (Logic)  │
└─────────────┘    └──────────────┘    └──────────────────┘    └────┬─────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │    Prisma    │
                                                              │     ORM      │
                                                              └──────┬───────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │  PostgreSQL  │
                                                              │  (Supabase)  │
                                                              └──────────────┘
```

**Middleware Chain:**
```
Request → authenticate (JWT) → requireRole(['ADMIN']) → Controller → Service → DB
```

**Role enforcement is at the router level** — controllers are pure HTTP adapters with no role checks inside them.

---

## 🎭 Features by Role

<details>
<summary><b>🎓 Student</b></summary>

| Feature | Description |
|---|---|
| 📝 Log study entries | Subject, hours, date, optional notes |
| 📊 Study history | Paginated, filterable by date range |
| 🏆 Leaderboards | Daily & weekly rankings within your track |
| 💬 Daily quote | Motivational programming quote each day |
| 📈 Progress stats | Weekly/monthly hours with totals |

> Students register with `PENDING_APPROVAL` status and must be approved by their track supervisor before accessing the platform.

</details>

<details>
<summary><b>👩‍💼 Supervisor</b></summary>

| Feature | Description |
|---|---|
| 🎓 Create & manage track | One track per supervisor (atomic create + link) |
| ⏳ Approval queue | Review pending registrations — FIFO order |
| ✅ Approve students | Sets status to `ACTIVE`, enforces capacity |
| ❌ Reject students | Sets status to `ARCHIVED` (audit-safe, reversible) |
| 👥 Track overview | All students with weekly/monthly hours |
| 🔍 Student details | Full entry history + subject breakdown |

</details>

<details>
<summary><b>🛡️ Admin</b></summary>

| Feature | Description |
|---|---|
| ➕ Create supervisors | Auto-generated username + temp password |
| 📊 System dashboard | Parallel counts: students, tracks, hours |
| 📈 Analytics | Top students, subject distribution, track stats |
| 🔍 Student management | Filter by status/track/search, suspend/archive/delete |
| 🏗️ Track overview | All tracks with supervisor info + live counts |
| 👩‍💼 Supervisor list | All supervisors with their track assignments |

</details>

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥ 22.x | Runtime |
| Express | 5.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM + migrations |
| PostgreSQL | via Supabase | Database |
| JWT | jsonwebtoken 9.x | Authentication |
| bcrypt | 6.x | Password hashing |
| ts-node-dev | 2.x | Dev hot reload |
| Jest + Supertest | 30.x | Testing |

### Frontend (Mobile)
| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.85 | Mobile framework |
| Expo | SDK 52 | Dev toolchain |
| TypeScript | 5.x | Type safety |
| React Navigation | 6.x | Stack + Tab navigation |
| React Hook Form | 7.x | Form management |
| Axios | 1.x | HTTP client |
| AsyncStorage | — | Token persistence |

---

## 📁 Project Structure

```
ITIER-Back-End/
│
├── 📂 docs/
│   └── API.md                         ← Full Phase 2 API reference
│
├── 📂 prisma/
│   ├── schema.prisma                  ← Role, StudentStatus, Track, User models
│   ├── seed.ts                        ← Admin + supervisors + tracks + 7 students
│   └── migrations/
│       └── 20260508020316_phase2/     ← Phase 2 schema migration
│
├── 📂 src/
│   ├── 📂 controllers/               ← HTTP only: parse → validate → respond
│   │   ├── auth.controller.ts
│   │   ├── entry.controller.ts
│   │   ├── supervisor.controller.ts
│   │   ├── track.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── 📂 services/                  ← Business logic + all Prisma queries
│   │   ├── auth.service.ts
│   │   ├── entry.service.ts
│   │   ├── supervisor.service.ts
│   │   ├── track.service.ts
│   │   ├── admin.service.ts
│   │   ├── analytics.service.ts
│   │   └── quote.service.ts
│   │
│   ├── 📂 routes/                    ← Express routers + role middleware
│   │   ├── auth.routes.ts
│   │   ├── entry.routes.ts
│   │   ├── supervisor.routes.ts
│   │   ├── track.routes.ts
│   │   ├── admin.routes.ts
│   │   └── leaderboard.routes.ts
│   │
│   ├── 📂 middleware/
│   │   ├── authenticate.ts           ← JWT verification
│   │   ├── authorize.ts              ← requireRole([...]) factory
│   │   └── errorHandler.ts           ← Global AppError handler
│   │
│   ├── 📂 utils/
│   │   └── AppError.ts               ← Typed operational error class
│   │
│   ├── 📂 types/
│   │   ├── index.ts                  ← JWTPayload, RegisterRequest, etc.
│   │   └── express.d.ts              ← req.user augmentation
│   │
│   └── app.ts                        ← Express app entry point
│
├── 📂 tests/
│   ├── auth.test.ts
│   ├── entries.test.ts
│   └── phase2-flow.test.ts           ← 12-step E2E approval workflow
│
├── Study-Tracker-Phase2.postman_collection.json
├── vercel.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 22.x
- PostgreSQL database (Supabase free tier works great)
- npm ≥ 10.x

### 1. Clone & Install

```bash
git clone https://github.com/Ahmed-ElKashif/ITIER-study-tracker-backend.git
cd ITIER-study-tracker-backend

npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000
```

### 3. Database Setup

```bash
# Apply Phase 2 migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed demo data
npx prisma db seed
```

### 4. Run the Server

```bash
npm run dev
# ✅  Server running at http://localhost:3000
# ✅  Environment: development
```

### 5. Mobile App (Expo)

```bash
cd StudyTracker
npm install
npx expo start
```

> ⚠️ **Physical Device:** Update `API_BASE_URL` in `src/api/client.ts` to your PC's local IP address (e.g. `http://192.168.1.5:3000`) — **not** `localhost`.

---

## 🔌 API Overview

> Full reference: [`docs/API.md`](./docs/API.md)  
> Base URL: `http://localhost:3000/api/v1`

### 🔓 Authentication (Public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Student registration → `PENDING_APPROVAL` |
| `POST` | `/auth/login` | Login — blocks PENDING / SUSPENDED / ARCHIVED |

### 🎓 Tracks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tracks` | Public | Active tracks list for registration |
| `POST` | `/tracks` | `SUPERVISOR` | Create track (1 per supervisor) |
| `PUT` | `/tracks/:id` | `SUPERVISOR` | Update own track |
| `GET` | `/tracks/me` | `SUPERVISOR` | My track + live student count |

### 👩‍💼 Supervisor

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/supervisor/pending-students` | Queue of pending registrations |
| `POST` | `/supervisor/students/:id/approve` | Approve → `ACTIVE` (capacity checked) |
| `POST` | `/supervisor/students/:id/reject` | Reject → `ARCHIVED` |
| `GET` | `/supervisor/track-overview` | Full dashboard with all student stats |
| `GET` | `/supervisor/student/:id` | Individual student entry history |

### 🛡️ Admin

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/supervisors` | Create supervisor + temp password |
| `GET` | `/admin/dashboard` | System counts (parallel queries) |
| `GET` | `/admin/analytics` | Top students, subjects, track stats |
| `GET` | `/admin/supervisors` | All supervisors with track info |
| `GET` | `/admin/tracks` | All tracks with supervisor info |
| `GET` | `/admin/students` | All students — filterable + searchable |
| `GET` | `/admin/students/pending` | System-wide pending queue |
| `PUT` | `/admin/students/:id/status` | Update student status |
| `DELETE` | `/admin/users/:id` | Delete user (admin-protected) |

### 📝 Study Entries `[STUDENT]`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/entries` | Create study entry |
| `GET` | `/entries/me` | Get own entries (`?startDate` `?endDate`) |
| `PUT` | `/entries/:id` | Update entry |
| `DELETE` | `/entries/:id` | Delete entry |

---

## 🔑 Demo Credentials

> Run `npx prisma db seed` first.

| Role | Username | Password | Notes |
|---|---|---|---|
| 🛡️ Admin | `ahmed_admin` | `admin123` | Full system access |
| 👩‍💼 Supervisor | `amira_supervisor` | `supervisor123` | Owns Track 1 |
| 👩‍💼 Supervisor | `hassan_supervisor` | `supervisor123` | Owns Track 2 |
| 🎓 Student | `student1` | `password123` | Active — can log in |
| 🎓 Student | `student2` | `password123` | Active — can log in |

> **New registrations** default to `PENDING_APPROVAL`. A supervisor must approve them via `POST /api/v1/supervisor/students/:id/approve` before they can log in.

---

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Phase 2 E2E flow only
```bash
npm test -- phase2-flow
```

### What the Phase 2 test covers (12 steps)

```
1. Admin login with seeded credentials
2. Admin creates supervisor (receives temp password)
3. Supervisor logs in with temp password
4. Supervisor creates a track
5. Student registers → status: PENDING_APPROVAL
6. Student login BLOCKED → 403 + errorCode: PENDING_APPROVAL ✅
7. Supervisor sees student in pending queue
8. Supervisor approves student → status: ACTIVE
9. Student login SUCCEEDS ✅
10. Track capacity enforcement (409 when full)
11. Admin suspends student → login blocked 403 + errorCode: SUSPENDED
12. Admin dashboard reflects updated counts
```

---

## 🔄 Student Lifecycle

```
                    ┌─────────────────────────────────────┐
                    │            REGISTRATION              │
                    │  POST /auth/register + trackId       │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                             ┌──────────────────┐
                             │ PENDING_APPROVAL  │  ← Cannot login
                             └────────┬─────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               │                      │                        │
               ▼                      ▼                        ▼
        ┌──────────┐          ┌──────────────┐         ┌──────────┐
        │  ACTIVE  │          │   ARCHIVED   │         │ (pending │
        │ ✅ Login │          │ ❌ Login     │         │  admin   │
        │  allowed │          │  (rejected)  │         │  action) │
        └────┬─────┘          └──────────────┘         └──────────┘
             │
             ▼
      ┌─────────────┐
      │  SUSPENDED  │  ← Admin action
      │  ❌ Login   │
      └─────────────┘
```

**`errorCode` in login response** lets the React Native app route to the correct screen:

| `errorCode` | Screen to show |
|---|---|
| `PENDING_APPROVAL` | "⏳ Awaiting supervisor approval" |
| `SUSPENDED` | "🚫 Account suspended" |
| `ARCHIVED` | "❌ Registration not approved" |

---

## 📬 Postman Collection

Import **`Study-Tracker-Phase2.postman_collection.json`** into Postman.

**13 tests** with automatic variable chaining:
- Tokens saved automatically between requests (`adminToken`, `supervisorToken`, `studentToken`)
- IDs auto-captured (`trackId`, `studentId`)
- Run the entire flow with one click via **Collection Runner** ▶️

---

## 🌿 Git Branch Strategy

| Branch | Status | Description |
|---|---|---|
| `main` | 🟢 Active | Production-ready, always deployable |
| `feature/phase2-backend` | ✅ Merged | Complete Phase 2 backend |
| `feature/day-1-auth` | 📦 Archived | Phase 1 auth implementation |
| `feature/day-2-core` | 📦 Archived | Phase 1 core features |
| `feature/day-3-supervisor` | 📦 Archived | Phase 1 supervisor features |

---

## 🗺️ Roadmap

| Phase | Timeline | Status |
|---|---|---|
| Phase 1 — Core Backend | Days 1-10 | ✅ Complete |
| Phase 2 — Role-Based Backend | Days 11-12 | ✅ **Complete** |
| Phase 3 — React Native UI (Phase 2) | Days 13-14 | 🔜 Upcoming |
| Phase 4 — Integration & Deployment | Day 15 | 🔜 Upcoming |

**Day 13 Preview:**
- Track selection screen (registration flow)
- "Pending Approval" waiting screen
- Supervisor approval interface (approve/reject with swipe)

**Day 14 Preview:**
- Admin dashboard mobile UI
- KPI cards for supervisors
- Student analytics charts

---

## 👨‍💻 Author

<div align="center">

**Ahmed ElKashif**

ITP Front-End & Mobile Dev Track — Cohort R2 2026

Information Technology Institute (ITI) — Egypt

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-Ahmed--ElKashif-181717?style=for-the-badge&logo=github)](https://github.com/Ahmed-ElKashif)

</div>

---

<div align="center">

**Built with ❤️ for ITI · Phase 2 Complete ✅**

*"Study hard, track smarter."*

</div>
