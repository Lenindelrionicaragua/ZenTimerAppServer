import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

const request = supertest(app);

let userId; // Store user ID for later use

beforeAll(async () => {
  await connectToMockDB();
});

// Clear database after each test
afterEach(async () => {
  await clearMockDatabase();
});

// Close the database connection after all tests
afterAll(async () => {
  await closeMockDatabase();
});

describe("Habit Category Tests", () => {
  beforeEach(async () => {
    // Create a new user and get the userId
    const testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // Sign up the test user
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Log in the user to get the user ID
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id; // Capture the user ID

    // Create new habit categories for testing
    const categories = [
      {
        name: "Work",
        totalMinutes: 120,
        createdBy: userId,
        createdAt: new Date("2024-07-01"),
      },
      {
        name: "Exercise",
        totalMinutes: 60,
        createdBy: userId,
        createdAt: new Date("2024-07-05"),
      },
      {
        name: "Study",
        totalMinutes: 90,
        createdBy: userId,
        createdAt: new Date("2024-07-10"),
      },
      {
        name: "Work",
        totalMinutes: 45,
        createdBy: userId,
        createdAt: new Date("2024-08-01"),
      },
    ];

    logInfo(`Populate MockDB: ${JSON.stringify(categories, null, 2)}`);

    // Loop through the categories and create them in the database
    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category,
      });
    }
  });

  it("should return total minutes of 'Work' category in July 2024", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    logInfo(`User ID: ${userId}`);
    logInfo(`Response: ${JSON.stringify(response.body)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    // Check the total minutes for 'Work' category
    const categoryData = response.body.categoryData;
    const workCategory = categoryData.find((cat) => cat.name === "Work");
    expect(workCategory).toBeDefined();
    expect(workCategory.totalMinutes).toBe(120); // Expect total minutes for July
  });

  it("should return total minutes of 'Exercise' category in July 2024", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    // Check the total minutes for 'Exercise' category
    const categoryData = response.body.categoryData;
    const exerciseCategory = categoryData.find(
      (cat) => cat.name === "Exercise"
    );
    expect(exerciseCategory).toBeDefined();
    expect(exerciseCategory.totalMinutes).toBe(60); // Expect total minutes for July
  });

  it("should return 404 if no categories found", async () => {
    // Clear the categories to test the case with no categories
    await clearMockDatabase();

    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty(
      "message",
      "No categories found for this user."
    );
  });

  it("should return 400 if invalid period type", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "invalid",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "BAD REQUEST: Invalid period type."
    );
  });

  it("should return 400 if invalid start date format", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "month",
        startDate: "invalid-date",
        endDate: "2024-07-31",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "message",
      "BAD REQUEST: Invalid start date format. Expected format: YYYY-MM-DD."
    );
  });

  it("should return categories for a specific day", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "day",
        startDate: "2024-07-05",
        endDate: "2024-07-05",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    const categoryData = response.body.categoryData;
    const exerciseCategory = categoryData.find(
      (cat) => cat.name === "Exercise"
    );
    expect(exerciseCategory).toBeDefined();
    expect(exerciseCategory.totalMinutes).toBe(60); // Expect total minutes for that day
  });

  it("should return categories for a specific week", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "week",
        startDate: "2024-07-01",
        endDate: "2024-07-07",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    const categoryData = response.body.categoryData;
    const workCategory = categoryData.find((cat) => cat.name === "Work");
    expect(workCategory).toBeDefined();
    expect(workCategory.totalMinutes).toBe(120); // Expect total minutes for the week
  });

  it("should return categories for a specific month", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    const categoryData = response.body.categoryData;

    // Check 'Work' category
    const workCategory = categoryData.find((cat) => cat.name === "Work");
    expect(workCategory).toBeDefined();
    expect(workCategory.totalMinutes).toBe(120); // Expect total minutes for July

    // Check 'Study' category
    const studyCategory = categoryData.find((cat) => cat.name === "Study");
    expect(studyCategory).toBeDefined();
    expect(studyCategory.totalMinutes).toBe(90); // Expect total minutes for July
  });

  it("should return categories for a specific year", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "year",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    const categoryData = response.body.categoryData;
    // Check 'Study' category total minutes for the year
    const studyCategory = categoryData.find((cat) => cat.name === "Study");
    expect(studyCategory).toBeDefined();
    expect(studyCategory.totalMinutes).toBe(90); // Expect total minutes for the year
  });

  it("should return categories for a specific year", async () => {
    const response = await request
      .get("/api/test/habit-categories/time")
      .query({
        userId,
        periodType: "year",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");

    const categoryData = response.body.categoryData;
    // Check 'Study' category total minutes for the year
    const studyCategory = categoryData.find((cat) => cat.name === "Study");
    expect(studyCategory).toBeDefined();
    expect(studyCategory.totalMinutes).toBe(90); // Expect total minutes for the year
  });
});
