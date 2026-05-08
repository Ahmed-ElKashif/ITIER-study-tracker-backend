import request from "supertest";
import app from "../src/app";

/**
 * Phase 2 end-to-end flow test.
 *
 * Covers the complete approval workflow:
 *   Admin login → create supervisor → supervisor login → create track →
 *   student register (PENDING) → student login blocked →
 *   supervisor approves → student login succeeds → track capacity enforced
 *
 * NOTE: This test relies on the seeded admin account (ahmed_admin / admin123)
 * and a clean test database. Run `npm run db:seed` before executing.
 */

describe("Phase 2: Approval Workflow (E2E)", () => {
  let adminToken: string;
  let supervisorToken: string;
  let supervisorUsername: string;
  let supervisorPassword: string;
  let trackId: number;
  let studentId: number;

  // ── Test 1: Admin login ────────────────────────────────
  it("Admin can login with seeded credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: "ahmed_admin",
      password: "admin123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.role).toBe("ADMIN");
    adminToken = res.body.data.token;
  });

  // ── Test 2: Admin creates supervisor ──────────────────
  it("Admin can create a supervisor with temporary password", async () => {
    const res = await request(app)
      .post("/api/v1/admin/supervisors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "flowtest@iti.com", fullName: "Flow Test Supervisor" });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("temporaryPassword");
    expect(res.body.data.supervisor.role).toBe("SUPERVISOR");

    supervisorUsername = res.body.data.supervisor.username;
    supervisorPassword = res.body.data.temporaryPassword;
  });

  // ── Test 3: Supervisor login ───────────────────────────
  it("Supervisor can login with temporary password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: supervisorUsername,
      password: supervisorPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("SUPERVISOR");
    supervisorToken = res.body.data.token;
  });

  // ── Test 4: Supervisor creates track ──────────────────
  it("Supervisor can create a track (one per supervisor)", async () => {
    const res = await request(app)
      .post("/api/v1/tracks")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        name: "Test Flow Track",
        description: "E2E approval flow test track",
        duration: "3 months",
        maxStudents: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    trackId = res.body.data.id;
  });

  // ── Test 5: Student registers ─────────────────────────
  it("Student can register and is set to PENDING_APPROVAL", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      username: "flowstudent",
      email: "flowstudent@iti.com",
      password: "password123",
      fullName: "Flow Test Student",
      trackId,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING_APPROVAL");
    studentId = res.body.data.userId;
  });

  // ── Test 6: Pending student cannot login ──────────────
  it("Pending student is blocked from logging in (403)", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: "flowstudent",
      password: "password123",
    });

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe("PENDING_APPROVAL");
  });

  // ── Test 7: Supervisor sees pending list ──────────────
  it("Supervisor sees the pending student in their queue", async () => {
    const res = await request(app)
      .get("/api/v1/supervisor/pending-students")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    const ids = res.body.data.map((s: any) => s.id);
    expect(ids).toContain(studentId);
  });

  // ── Test 8: Supervisor approves student ───────────────
  it("Supervisor can approve a pending student", async () => {
    const res = await request(app)
      .post(`/api/v1/supervisor/students/${studentId}/approve`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ACTIVE");
  });

  // ── Test 9: Approved student can now login ────────────
  it("Approved student can login successfully", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: "flowstudent",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe("ACTIVE");
    expect(res.body.data).toHaveProperty("token");
  });

  // ── Test 10: Track capacity enforcement ───────────────
  it("Track capacity is enforced — track full at maxStudents=2", async () => {
    // Register 2nd student and approve them (fills the track)
    const reg2 = await request(app).post("/api/v1/auth/register").send({
      username: "flowstudent2",
      email: "flowstudent2@iti.com",
      password: "password123",
      fullName: "Flow Test Student 2",
      trackId,
    });
    expect(reg2.status).toBe(201);

    const pending = await request(app)
      .get("/api/v1/supervisor/pending-students")
      .set("Authorization", `Bearer ${supervisorToken}`);

    const student2Id = pending.body.data.find(
      (s: any) => s.username === "flowstudent2",
    )?.id;
    expect(student2Id).toBeDefined();

    await request(app)
      .post(`/api/v1/supervisor/students/${student2Id}/approve`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    // Attempt to register 3rd student — track is now full
    const reg3 = await request(app).post("/api/v1/auth/register").send({
      username: "flowstudent3",
      email: "flowstudent3@iti.com",
      password: "password123",
      fullName: "Flow Test Student 3",
      trackId,
    });

    expect(reg3.status).toBe(409);
    expect(reg3.body).toHaveProperty("maxStudents");
  });

  // ── Test 11: Admin can suspend a student ──────────────
  it("Admin can suspend a student — they cannot login after", async () => {
    const suspend = await request(app)
      .put(`/api/v1/admin/students/${studentId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SUSPENDED" });

    expect(suspend.status).toBe(200);
    expect(suspend.body.data.status).toBe("SUSPENDED");

    const loginAttempt = await request(app).post("/api/v1/auth/login").send({
      username: "flowstudent",
      password: "password123",
    });

    expect(loginAttempt.status).toBe(403);
    expect(loginAttempt.body.errorCode).toBe("SUSPENDED");
  });

  // ── Test 12: Admin dashboard reflects changes ─────────
  it("Admin dashboard reflects the newly added users", async () => {
    const res = await request(app)
      .get("/api/v1/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.students.total).toBeGreaterThan(0);
    expect(res.body.data.supervisors.total).toBeGreaterThan(0);
  });
});
