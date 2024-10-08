import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
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
        name: "Leisure",
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

    // Loop through the categories and create them in the database
    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category,
      });
    }
  });

  it("should return total minutes of 'Work' category in July 2024", async () => {
    const response = await request
      .post("/test/api/habit-categories/time") // Use POST instead of GET since we're sending data in the body
      .send({
        userId, // Include userId in the body
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    logInfo(`User ID: ${userId}`); // Verify userId is defined
    logInfo(`Response: ${JSON.stringify(response.body)}`); // Inspect the response

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
      .post("/test/api/habit-categories/time") // Use POST instead of GET since we're sending data in the body
      .send({
        userId, // Include userId in the body
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
});
