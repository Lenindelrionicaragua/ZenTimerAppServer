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

describe("Habit Category Percentage Time Tests", () => {
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
      {
        name: "Rest",
        totalMinutes: 45,
        createdBy: userId,
        createdAt: new Date("2024-01-01"),
      },
      {
        name: "Family-Time",
        totalMinutes: 300,
        createdBy: userId,
        createdAt: new Date("2023-12-15"),
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

  it("should return total percentage of time with all the categories for July 2024", async () => {
    const response = await request
      .get("/api/test/habit-categories/time-percentage")
      .query({
        userId,
        years: "2024",
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      });

    logInfo(`User ID: ${userId}`);
    logInfo(`Response: ${JSON.stringify(response.body)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body).toHaveProperty("categoryDataPercentage");

    const { totalMinutes, categoryDataPercentage } = response.body;

    // Check the totalMinutes calculation
    const expectedTotalMinutes = 120 + 60 + 90; // Total for July
    expect(totalMinutes).toBe(expectedTotalMinutes);

    // Check the category percentages
    const workCategory = categoryDataPercentage.find(
      (cat) =>
        cat.name === "Work" &&
        cat.createdAt >= new Date("2024-07-01") &&
        cat.createdAt <= new Date("2024-07-31")
    );
    const exerciseCategory = categoryDataPercentage.find(
      (cat) =>
        cat.name === "Exercise" &&
        cat.createdAt >= new Date("2024-07-01") &&
        cat.createdAt <= new Date("2024-07-31")
    );
    const studyCategory = categoryDataPercentage.find(
      (cat) =>
        cat.name === "Study" &&
        cat.createdAt >= new Date("2024-07-01") &&
        cat.createdAt <= new Date("2024-07-31")
    );

    const expectedWorkPercentage = ((120 / expectedTotalMinutes) * 100).toFixed(
      2
    );
    const expectedExercisePercentage = (
      (60 / expectedTotalMinutes) *
      100
    ).toFixed(2);
    const expectedStudyPercentage = ((90 / expectedTotalMinutes) * 100).toFixed(
      2
    );

    expect(workCategory.percentage).toBe(expectedWorkPercentage);
    expect(exerciseCategory.percentage).toBe(expectedExercisePercentage);
    expect(studyCategory.percentage).toBe(expectedStudyPercentage);
  });

  // it("should return 404 if no categories found for the specified month", async () => {
  //   const response = await request
  //     .get("/api/test/habit-categories/time-percentage")
  //     .query({
  //       userId,
  //       years: "2024",
  //       periodType: "month",
  //       startDate: "2024-09-01",
  //       endDate: "2024-09-30",
  //     });

  //   expect(response.status).toBe(404);
  //   expect(response.body).toHaveProperty(
  //     "message",
  //     "No categories found for this user."
  //   );
  // });

  // it("should return validation error if required parameters are missing", async () => {
  //   const response = await request
  //     .get("/api/test/habit-categories/time-percentage")
  //     .query({
  //       userId,
  //       years: "2024",
  //       // Missing startDate and endDate
  //     });

  //   expect(response.status).toBe(400);
  //   expect(response.body).toHaveProperty("message");
  //   expect(response.body.message).toContain(
  //     "Both startDate and endDate are required if specifying a date range."
  //   );
  // });
});
