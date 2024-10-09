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
    ];

    logInfo(`Populate MockDB: ${JSON.stringify(categories, null, 2)}`);

    // Loop through the categories and create them in the database
    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category,
      });
    }
  });

  it("should return total percentage of time for 'Work' category in July 2024", async () => {
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
    expect(response.body).toHaveProperty("categoryData");

    // Check the percentage of time for 'Work' category
    const categoryData = response.body.categoryData;
    const workCategory = categoryData.find((cat) => cat.name === "Work");

    expect(workCategory).toBeDefined();
    expect(workCategory.percentageTime).toBeDefined(); // Check for percentage
    // You can also add an expected percentage value based on your calculation logic
  });
});
