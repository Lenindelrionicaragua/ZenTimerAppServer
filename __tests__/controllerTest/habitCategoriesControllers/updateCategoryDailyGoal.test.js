import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";

const request = supertest(app);

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Update Daily Goal Tests", () => {
  let testUser;
  let cookie;
  let categoryId;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // User sign-up and login
    await request.post("/api/auth/sign-up").send({ user: testUser });

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];

    // delete the default categories
    await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    // Create a habit category
    const newCategory = {
      habitCategory: { name: "Exercise", dailyGoal: 30 },
    };

    const categoryResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    categoryId = categoryResponse.body.category._id;
  });

  it("should successfully update dailyGoal for a valid category", async () => {
    const newDailyGoal = 45;
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: newDailyGoal });

    expect(response.status).toBe(200); // OK
    expect(response.body.success).toBe(true);
    expect(response.body.category.dailyGoal).toBe(newDailyGoal);
  });

  it("should return 400 if dailyGoal is missing", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({});

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("dailyGoal is required.");
  });

  it("should return 400 if dailyGoal is not a number", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: "notANumber" });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "BAD REQUEST: Daily goal must be an integer.",
    );
  });

  it("should return 404 if the category is not found", async () => {
    const nonExistentCategoryId = "609b4ec3d1f85b22f0953d91";
    const response = await request
      .patch(`/api/habit-categories/${nonExistentCategoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: 45 });

    expect(response.status).toBe(404); // Not Found
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Category not found.");
  });

  it("should return 403 if the user is not authorized to update the category", async () => {
    // Simulate another user creating a category
    const anotherUser = {
      name: "Another User",
      email: "anotheruser@example.com",
      password: "Another1234!",
      dateOfBirth: "Tue Feb 01 1992",
    };

    await request.post("/api/auth/sign-up").send({ user: anotherUser });

    const loginResponse = await request.post("/api/auth/log-in").send({
      user: { email: anotherUser.email, password: anotherUser.password },
    });

    const anotherUserCookie = loginResponse.headers["set-cookie"];

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", anotherUserCookie)
      .send({ dailyGoal: 50 });

    expect(response.status).toBe(403); // Forbidden
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Forbidden: You are not authorized to update this category.",
    );
  });

  it("should return 401 if the user is not authenticated", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", "") // No authentication
      .send({ dailyGoal: 45 });

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Authentication required.");
  });

  it("should allow updating dailyGoal to the minimum allowed value", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: 15 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.dailyGoal).toBe(15);
  });

  it("should allow updating dailyGoal to the maximum allowed value", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: 1440 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.category.dailyGoal).toBe(1440);
  });

  it("should return 400 if dailyGoal is below the minimum allowed value", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: 14 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Daily goal must be at least 15 minutes.",
    );
  });

  it("should return 400 if dailyGoal is above the maximum allowed value", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: 1441 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Daily goal cannot exceed 1440 minutes (24 hours).",
    );
  });

  it("should return 400 if dailyGoal is null", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: null });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("dailyGoal is required.");
  });

  it("should return 400 if dailyGoal is an empty string", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: "" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("dailyGoal is required.");
  });

  it("should return 400 if dailyGoal is an object", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: {} });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Daily goal must be an integer.");
  });

  it("should return 400 if dailyGoal is an array", async () => {
    const response = await request
      .patch(`/api/habit-categories/${categoryId}/update-daily-goal`)
      .set("Cookie", cookie)
      .send({ dailyGoal: [] });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Daily goal must be an integer.");
  });

  it("should return 400 if the category ID is in an invalid format", async () => {
    const response = await request
      .patch("/api/habit-categories/invalid-id/update-daily-goal")
      .set("Cookie", cookie)
      .send({ dailyGoal: 30 });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Invalid category ID.");
  });
});
