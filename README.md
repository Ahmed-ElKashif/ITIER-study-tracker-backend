# itier — Study Tracker for ITI Students

Mobile-first study tracking platform for ITI students and supervisors.

## Features

### For Students

- 📝 Log daily study entries (subject, hours, notes)
- 📊 View study history with total statistics
- 🏆 Daily/weekly leaderboards (Codeforces-style)
- 💬 Daily motivational programming quotes
- 📈 Weekly and monthly progress tracking

### For Supervisors

- 👥 Monitor all students in your track
- 📊 Track-level analytics (average hours, top subject)
- 🔍 Search and filter students by name/username
- 📈 View individual student details and subject breakdown
- 🏆 Track leaderboard view

## Tech Stack

**Frontend (Mobile):**

- React Native 0.85 + TypeScript
- React Navigation (Stack + Bottom Tabs)
- React Hook Form + Yup validation
- Axios (HTTP client)
- AsyncStorage (token persistence)

**Backend (API):**

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcrypt password hashing

## Prerequisites

- Node.js >= 22.11.0
- PostgreSQL database (Supabase / Railway / Local)
- React Native development environment
- **Expo Go** app installed on your physical Android/iOS device
- Node.js >= 18.0.0

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend folder
cd study-tracker-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npx prisma migrate dev
npx prisma generate

# Seed demo data
npx prisma db seed

# Start server
npm run dev
```

The server runs at `http://localhost:3000`.

### 2. Mobile App (Expo)

```bash
# Navigate to mobile app folder
cd StudyTracker

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### 3. Testing on Physical Device

1. Download **Expo Go** from the Google Play Store (Android) or App Store (iOS).
2. Connect your phone to the same WiFi network as your PC.
3. Open the Camera app (iOS) or Expo Go app (Android) and scan the QR code that appears in your terminal after running `npx expo start`.

> **Note:** The app is configured to connect to your local backend. You MUST update the `API_BASE_URL` in `src/api/client.ts` with your PC's local IP address (e.g., `192.168.1.5`) instead of `localhost` or `10.0.2.2`.

## Demo Credentials

After running the seed script:

| Role       | Username    | Password    |
| ---------- | ----------- | ----------- |
| Student    | student1    | password123 |
| Supervisor | supervisor1 | password123 |

## Project Structure

```
study-tracker-backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── app.ts
└── tests/

StudyTracker/           ← React Native App
├── src/
│   ├── api/            ← Axios client & endpoints
│   ├── components/     ← Reusable UI components
│   ├── contexts/       ← AuthContext (user session)
│   ├── navigation/     ← Stack & Tab navigators
│   ├── screens/
│   │   ├── auth/       ← Login, Register
│   │   ├── student/    ← Home, AddEntry, History, Leaderboard
│   │   └── supervisor/ ← Dashboard, Students, Leaderboard
│   ├── types/          ← TypeScript interfaces
│   └── utils/          ← Theme (colors, spacing)
└── App.tsx
```

## API Endpoints

See `docs/API.md` for complete API documentation.

## Future Enhancements

- Course results tracking
- KPI dashboards for instructors
- Push notifications for daily reminders
- Data visualization charts
- Export reports (PDF/Excel)
- Instructor role

## License

MIT

## Author

Ahmed ElKashif
ITP Front-End & Mobile Dev Track
ITI 2026
