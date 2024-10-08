import supertest from "supertest";
import fs from "fs";
import path from "path";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";

const request = supertest(app);

// Mock data file
const mockDataPath = path.join(
  __dirname,
  "../../../__testUtils__/mockHabitCategoryData.json"
);

let mockData;

beforeAll(async () => {
  await connectToMockDB();

  const rawData = fs.readFileSync(mockDataPath);
  mockData = JSON.parse(rawData);
});

// Populate the mock database
beforeEach(async () => {
  await HabitCategory.insertMany(mockData.categories);
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("GET /api/test/habit-categories", () => {
  let testUser;
  let userId;

  beforeEach(async () => {
    // Step 1: Create a new user
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Step 2: Log in with the created user to get the userId (skip token here for simplicity)
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id; // Capture the user's id from the login response
  });

  it("should return total minutes of 'Work' category in July 2024", async () => {
    const response = await request
      .get("/test/api/habit-categories/time")
      .query({
        periodType: "month",
        startDate: "2024-07-01",
        endDate: "2024-07-31",
      })
      .send({
        userId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("categoryData");
    // Más expectativas sobre el contenido de categoryData...
  });
});
