import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/prisma";

describe("Authentication", () => {
  let trackId: number;

  beforeAll(async () => {
    // Get the first track's real ID
    const track = await prisma.track.findFirst();
    trackId = track?.id ?? 1;
  });

  afterAll(async () => {
    // Clean up test user if it was created
    await prisma.user
      .delete({ where: { username: "testuser" } })
      .catch(() => {}); // ignore if not found
    await prisma.$disconnect();
  });

  test("POST /api/v1/auth/register - should register new user", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "testpass123",
      fullName: "Test User",
      role: "STUDENT",
      trackId,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("userId");
  });

  test("POST /api/v1/auth/login - should login with valid credentials", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      username: "student1",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data).toHaveProperty("user");
  });

  test("POST /api/v1/auth/login - should reject invalid credentials", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      username: "student1",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

