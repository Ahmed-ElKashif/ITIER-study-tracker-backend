import request from "supertest";
import app from "../src/app";

describe("Study Entries", () => {
  let studentToken: string;
  let entryId: number;

  beforeAll(async () => {
    // Login to get token
    const response = await request(app).post("/api/v1/auth/login").send({
      username: "student1",
      password: "password123",
    });

    studentToken = response.body.data.token;
  });

  test("POST /api/v1/entries - should create study entry", async () => {
    const response = await request(app)
      .post("/api/v1/entries")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        subject: "Jest Testing",
        hours: 2,
        date: "2026-04-25",
        notes: "Learning unit tests",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("entryId");

    entryId = response.body.data.entryId;
  });

  test("GET /api/v1/entries/me - should get user entries", async () => {
    const response = await request(app)
      .get("/api/v1/entries/me")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test("PUT /api/v1/entries/:id - should update entry", async () => {
    const response = await request(app)
      .put(`/api/v1/entries/${entryId}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        hours: 2.5,
        notes: "Updated notes",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("DELETE /api/v1/entries/:id - should delete entry", async () => {
    const response = await request(app)
      .delete(`/api/v1/entries/${entryId}`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(response.status).toBe(204);
  });
});
