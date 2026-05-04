import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.studyEntry.deleteMany();
  await prisma.user.deleteMany();
  await prisma.track.deleteMany();

  // Create track
  const track = await prisma.track.create({
    data: {
      name: "ITP Front-End & Mobile Dev",
      supervisorId: 1,
    },
  });
  console.log("✅ Track created:", track.name);

  // Create supervisor
  const supervisor = await prisma.user.create({
    data: {
      username: "supervisor1",
      email: "supervisor@iti.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "SUPERVISOR",
      fullName: "Eng. Amira AbdelHady",
      trackId: track.id,
    },
  });
  console.log("✅ Supervisor created:", supervisor.fullName);

  // Create students
  const studentNames = [
    "Ahmed ElKashif",
    "Sara Hassan",
    "Mohamed Ali",
    "Fatima Ahmed",
    "Omar Mahmoud",
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.create({
      data: {
        username: `student${i + 1}`,
        email: `student${i + 1}@iti.com`,
        passwordHash: await bcrypt.hash("password123", 10),
        role: "STUDENT",
        fullName: studentNames[i],
        trackId: track.id,
      },
    });
    students.push(student);
    console.log(`✅ Student created: ${student.fullName}`);
  }

  // Create study entries for past 7 days
  const today = new Date();
  const subjects = [
    "React Native",
    "TypeScript",
    "Node.js",
    "JavaScript",
    "HTML/CSS",
  ];

  for (const student of students) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);

      // Random 1-3 entries per day
      const entriesPerDay = Math.floor(Math.random() * 3) + 1;

      for (let e = 0; e < entriesPerDay; e++) {
        const randomSubject =
          subjects[Math.floor(Math.random() * subjects.length)];
        const randomHours = (Math.random() * 3 + 0.5).toFixed(1); // 0.5 to 3.5 hours

        await prisma.studyEntry.create({
          data: {
            userId: student.id,
            subject: randomSubject,
            hours: parseFloat(randomHours),
            date,
            notes: `Practiced ${randomSubject}`,
          },
        });
      }
    }
    console.log(`✅ Created entries for ${student.fullName}`);
  }

  console.log("🎉 Seeding completed!");
  console.log("\n📊 Summary:");
  console.log(`- 1 Track: ${track.name}`);
  console.log(`- 1 Supervisor: ${supervisor.fullName}`);
  console.log(`- ${students.length} Students`);
  console.log("\n🔐 Login credentials (all passwords: password123):");
  console.log("Supervisor: supervisor1 / password123");
  students.forEach((s, i) => {
    console.log(`Student ${i + 1}: student${i + 1} / password123`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
