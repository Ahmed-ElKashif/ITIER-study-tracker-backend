import { PrismaClient, Role, StudentStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Helper: hash password
// ──────────────────────────────────────────────
const hash = (password: string) => bcrypt.hash(password, 10);

async function main() {
  console.log("🌱 Seeding Phase 2 database...\n");

  // ──────────────────────────────────────────────
  // STEP 0: Clear existing data
  // User.trackId → Track AND Track.createdById → User creates a
  // circular FK. TRUNCATE CASCADE is the cleanest solution on PostgreSQL
  // — it handles all FK cycles atomically in one statement.
  // ──────────────────────────────────────────────
  console.log("🗑️  Clearing existing data...");
  await prisma.$executeRaw`TRUNCATE TABLE "study_entries", "tracks", "users" RESTART IDENTITY CASCADE`;
  console.log("   ✓ All tables cleared\n");


  // ──────────────────────────────────────────────
  // STEP 1: Create Admin (no track)
  // ──────────────────────────────────────────────
  console.log("👑 Creating admin user...");
  const admin = await prisma.user.create({
    data: {
      username: "ahmed_admin",
      email: "ahmed.admin@iti.com",
      passwordHash: await hash("admin123"),
      role: Role.ADMIN,
      fullName: "Ahmed ElKashif (Admin)",
      status: StudentStatus.ACTIVE,
      trackId: null,
    },
  });
  console.log(`   ✓ Admin: ${admin.username} (id: ${admin.id})\n`);

  // ──────────────────────────────────────────────
  // STEP 2: Create Supervisors (trackId set after tracks exist)
  // ──────────────────────────────────────────────
  console.log("👔 Creating supervisors...");
  const supervisor1 = await prisma.user.create({
    data: {
      username: "amira_supervisor",
      email: "amira.abdelhady@iti.com",
      passwordHash: await hash("supervisor123"),
      role: Role.SUPERVISOR,
      fullName: "Eng. Amira AbdelHady",
      status: StudentStatus.ACTIVE,
      trackId: null,
    },
  });

  const supervisor2 = await prisma.user.create({
    data: {
      username: "mohamed_supervisor",
      email: "mohamed.supervisor@iti.com",
      passwordHash: await hash("supervisor123"),
      role: Role.SUPERVISOR,
      fullName: "Eng. Mohamed Hassan",
      status: StudentStatus.ACTIVE,
      trackId: null,
    },
  });
  console.log(`   ✓ ${supervisor1.fullName} (id: ${supervisor1.id})`);
  console.log(`   ✓ ${supervisor2.fullName} (id: ${supervisor2.id})\n`);

  // ──────────────────────────────────────────────
  // STEP 3: Create Tracks (supervisor must exist first)
  // ──────────────────────────────────────────────
  console.log("🎓 Creating tracks...");
  const track1 = await prisma.track.create({
    data: {
      name: "ITP Front-End & Mobile Dev (9 months)",
      description:
        "9-month intensive program covering React, React Native, and modern frontend development.",
      duration: "9 months",
      maxStudents: 30,
      isActive: true,
      createdById: supervisor1.id,
    },
  });

  const track2 = await prisma.track.create({
    data: {
      name: "6-Month Backend Development Track",
      description:
        "Focused backend engineering program with Node.js, PostgreSQL, and system design.",
      duration: "6 months",
      maxStudents: 25,
      isActive: true,
      createdById: supervisor2.id,
    },
  });

  const track3 = await prisma.track.create({
    data: {
      name: "Fundamentals Track (6 months)",
      description:
        "Programming fundamentals, data structures, and algorithms.",
      duration: "6 months",
      maxStudents: 40,
      isActive: true,
      createdById: supervisor2.id,
    },
  });

  console.log(`   ✓ [${track1.id}] ${track1.name}`);
  console.log(`   ✓ [${track2.id}] ${track2.name}`);
  console.log(`   ✓ [${track3.id}] ${track3.name}\n`);

  // ──────────────────────────────────────────────
  // STEP 4: Assign supervisors to their primary tracks
  // ──────────────────────────────────────────────
  await prisma.user.update({
    where: { id: supervisor1.id },
    data: { trackId: track1.id },
  });
  await prisma.user.update({
    where: { id: supervisor2.id },
    data: { trackId: track2.id },
  });
  console.log("🔗 Supervisors assigned to primary tracks\n");

  // ──────────────────────────────────────────────
  // STEP 5: Create Students
  // ──────────────────────────────────────────────
  console.log("👨‍🎓 Creating students...");

  // Track 1 — ACTIVE students (approved)
  const track1ActiveData = [
    {
      username: "student1",
      fullName: "Ahmed Ali",
      email: "ahmed.ali@iti.com",
    },
    {
      username: "student2",
      fullName: "Sara Hassan",
      email: "sara.hassan@iti.com",
    },
    {
      username: "student3",
      fullName: "Mohamed Khaled",
      email: "mohamed.khaled@iti.com",
    },
  ];

  const track1ActiveStudents = [];
  for (const data of track1ActiveData) {
    const student = await prisma.user.create({
      data: {
        ...data,
        passwordHash: await hash("password123"),
        role: Role.STUDENT,
        status: StudentStatus.ACTIVE,
        trackId: track1.id,
      },
    });
    track1ActiveStudents.push(student);
    console.log(`   ✅ [ACTIVE] ${student.fullName} → ${track1.name}`);
  }

  // Track 1 — PENDING students (awaiting supervisor approval)
  const track1PendingData = [
    {
      username: "pending1",
      fullName: "Fatima Ahmed",
      email: "fatima.ahmed@iti.com",
    },
    {
      username: "pending2",
      fullName: "Omar Mahmoud",
      email: "omar.mahmoud@iti.com",
    },
  ];

  for (const data of track1PendingData) {
    const student = await prisma.user.create({
      data: {
        ...data,
        passwordHash: await hash("password123"),
        role: Role.STUDENT,
        status: StudentStatus.PENDING_APPROVAL,
        trackId: track1.id,
      },
    });
    console.log(`   ⏳ [PENDING] ${student.fullName} → ${track1.name}`);
  }

  // Track 2 — ACTIVE students
  const track2Data = [
    {
      username: "backend1",
      fullName: "Youssef Ibrahim",
      email: "youssef.ibrahim@iti.com",
    },
    {
      username: "backend2",
      fullName: "Nour Mohamed",
      email: "nour.mohamed@iti.com",
    },
  ];

  const track2Students = [];
  for (const data of track2Data) {
    const student = await prisma.user.create({
      data: {
        ...data,
        passwordHash: await hash("password123"),
        role: Role.STUDENT,
        status: StudentStatus.ACTIVE,
        trackId: track2.id,
      },
    });
    track2Students.push(student);
    console.log(`   ✅ [ACTIVE] ${student.fullName} → ${track2.name}`);
  }

  // ──────────────────────────────────────────────
  // STEP 6: Create Study Entries for ACTIVE students only
  // (PENDING students can't submit entries until approved)
  // ──────────────────────────────────────────────
  console.log("\n📚 Creating study entries (past 14 days)...");

  const activeStudentsForEntries = [
    ...track1ActiveStudents,
    ...track2Students,
  ];

  const subjects = [
    "React Native",
    "TypeScript",
    "Node.js",
    "JavaScript",
    "PostgreSQL",
    "System Design",
  ];

  let totalEntries = 0;

  for (const student of activeStudentsForEntries) {
    let studentEntries = 0;

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      // Zero out time portion to match @db.Date storage
      date.setHours(0, 0, 0, 0);

      // 1–2 entries per day (realistic workload)
      const entriesPerDay = Math.floor(Math.random() * 2) + 1;

      for (let e = 0; e < entriesPerDay; e++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const hours = parseFloat((Math.random() * 4 + 0.5).toFixed(1));

        await prisma.studyEntry.create({
          data: {
            userId: student.id,
            subject,
            hours,
            date,
            notes: `Studied ${subject} — Day ${14 - dayOffset}`,
          },
        });

        studentEntries++;
        totalEntries++;
      }
    }

    console.log(
      `   ✓ ${student.fullName}: ${studentEntries} entries created`,
    );
  }

  // ──────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────
  console.log("\n🎉 Phase 2 seeding completed!\n");
  console.log("📊 Database Summary:");
  console.log("─────────────────────────────────────────────");
  console.log(`👑 Admins:       1  (${admin.username})`);
  console.log(`👔 Supervisors:  2`);
  console.log(`🎓 Tracks:       3  (1 inactive placeholder + 2 active)`);
  console.log(
    `👨‍🎓 Students:    ${track1ActiveData.length + track1PendingData.length + track2Data.length} total`,
  );
  console.log(
    `   ✅ Active:  ${track1ActiveData.length + track2Data.length}`,
  );
  console.log(`   ⏳ Pending: ${track1PendingData.length}`);
  console.log(`📚 Study Entries: ${totalEntries}`);
  console.log("─────────────────────────────────────────────");

  console.log("\n🔐 Login Credentials:");
  console.log("─────────────────────────────────────────────");
  console.log("Role       Username            Password");
  console.log("─────────────────────────────────────────────");
  console.log("ADMIN      ahmed_admin         admin123");
  console.log("SUPERVISOR amira_supervisor    supervisor123");
  console.log("SUPERVISOR mohamed_supervisor  supervisor123");
  console.log("STUDENT    student1            password123  (ACTIVE)");
  console.log("STUDENT    student2            password123  (ACTIVE)");
  console.log("STUDENT    student3            password123  (ACTIVE)");
  console.log("STUDENT    backend1            password123  (ACTIVE)");
  console.log("STUDENT    backend2            password123  (ACTIVE)");
  console.log("STUDENT    pending1            password123  (PENDING ⛔)");
  console.log("STUDENT    pending2            password123  (PENDING ⛔)");
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
