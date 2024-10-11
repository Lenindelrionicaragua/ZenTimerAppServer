import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

const request = supertest(app);

let userId;

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Habit Category Percentage Time Tests", () => {
  beforeEach(async () => {
    const testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id;

    const categories = [
      {
        name: "Work",
        dailyRecords: [
          { totalMinutes: 120, date: new Date("2024-07-01") },
          { totalMinutes: 45, date: new Date("2024-08-01") },
        ],
        createdBy: userId,
        createdAt: new Date("2024-07-01"),
      },
      {
        name: "Exercise",
        dailyRecords: [{ totalMinutes: 60, date: new Date("2024-07-05") }],
        createdBy: userId,
        createdAt: new Date("2024-07-05"),
      },
      {
        name: "Study",
        dailyRecords: [{ totalMinutes: 90, date: new Date("2024-07-10") }],
        createdBy: userId,
        createdAt: new Date("2024-07-10"),
      },
    ];

    logInfo(`Populate MockDB: ${JSON.stringify(categories, null, 2)}`);

    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category,
      });
    }
  });

  it("should calculate and return category time percentages", async () => {
    const response = await request.get(
      `/api/test/habit-categories/time-percentage?userId=${userId}&years=2024&periodType=year&startDate=2024-01-01&endDate=2024-12-31`
    );

    logInfo(
      `Response for category time percentages: ${JSON.stringify(response.body)}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("totalMinutes");
    expect(response.body.totalMinutes).toBe(759); // Total de minutos sumados: 300 + 25 + 14 + 300 + 120

    expect(response.body).toHaveProperty("categoryDataPercentage");
    expect(Array.isArray(response.body.categoryDataPercentage)).toBe(true);
    expect(response.body.categoryDataPercentage).toContainEqual(
      expect.objectContaining({
        name: "Work",
        totalMinutes: 120,
        percentage: "15.81",
      }) // (120/759)*100
    );
  });
});
