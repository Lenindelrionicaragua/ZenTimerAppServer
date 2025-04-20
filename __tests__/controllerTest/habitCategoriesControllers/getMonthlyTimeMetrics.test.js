import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";

const request = supertest(app);

let testUser;
let cookie;
let categoryId1;
let categoryId2;

// Helper functions for test setup
const createTestUser = async () => {
  testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "Test1234!",
    dateOfBirth: "1990-02-01",
  };

  await request.post("/api/auth/sign-up").send({ user: testUser });

  const loginResponse = await request
    .post("/api/auth/log-in")
    .send({ user: { email: testUser.email, password: testUser.password } });

  return loginResponse.headers["set-cookie"];
};

const createTestCategories = async (cookie) => {
  // Delete default categories if needed
  await request
    .delete("/api/habit-categories/delete-all-categories")
    .set("Cookie", cookie);

  const categories = [
    { name: "Exercise", createdAt: "2024-01-01" },
    { name: "Reading", createdAt: "2024-01-01" },
  ];

  const createdIds = [];
  for (const category of categories) {
    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send({ habitCategory: category });
    createdIds.push(response.body.category._id);
  }

  return createdIds;
};

const createTestRecords = async (cookie, categoryId, dates) => {
  for (const date of dates) {
    await request
      .post(`/api/time-records/${categoryId}`)
      .set("Cookie", cookie)
      .send({ minutesUpdate: 30, date });
  }
};

describe("Monthly Metrics API", () => {
  beforeAll(async () => {
    await connectToMockDB();
    cookie = await createTestUser();
    [categoryId1, categoryId2] = await createTestCategories(cookie);

    // Create minimal test data - just enough for the test cases
    await createTestRecords(cookie, categoryId1, ["2024-02-05", "2024-02-15"]);
    await createTestRecords(cookie, categoryId2, ["2024-02-05"]);
  }, 10000);

  afterAll(async () => {
    await clearMockDatabase();
    await closeMockDatabase();
  });

  describe("Successful Requests", () => {
    it("should return metrics for February 2024", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=February&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalMinutes).toBe(90); // 30*3 records
      expect(response.body.categoryCount).toBe(2);
      expect(response.body.daysWithRecords).toBe(2);

      // Verify the daily minutes breakdown
      expect(response.body.totalDailyMinutes["2024-02-05"]).toBe(60); // 30+30
      expect(response.body.totalDailyMinutes["2024-02-15"]).toBe(30);

      // Verify category data
      expect(response.body.categoryData).toHaveLength(2);
      expect(response.body.categoryData[0].name).toBe("Exercise");
      expect(response.body.categoryData[0].totalMinutes).toBe(60);
      expect(response.body.categoryData[1].name).toBe("Reading");
      expect(response.body.categoryData[1].totalMinutes).toBe(30);
    });

    it("should return metrics when month is passed as number", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=2&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.totalMinutes).toBe(90);
    });

    it("should handle case-insensitive month names", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=fEbRuArY&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
    });

    it("should return metrics for a specific category", async () => {
      const response = await request
        .get(
          `/api/habit-categories/monthly-metrics?month=February&year=2024&categoryId=${categoryId1}`,
        )
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.categoryCount).toBe(1);
      expect(response.body.categoryData[0].name).toBe("Exercise");
      expect(response.body.totalMinutes).toBe(60);
    });

    it("should return empty data when no records exist", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=January&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.totalMinutes).toBe(0);
      expect(response.body.daysWithRecords).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should reject invalid month names", async () => {
      const response = await request
        .get(
          "/api/habit-categories/monthly-metrics?month=InvalidMonth&year=2024",
        )
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch("Invalid month name");
    });

    it("should reject month numbers < 1 or > 12", async () => {
      const tests = [
        { month: 0, expectedError: "between 1 and 12" },
        { month: 13, expectedError: "between 1 and 12" },
      ];

      for (const test of tests) {
        const response = await request
          .get(
            `/api/habit-categories/monthly-metrics?month=${test.month}&year=2024`,
          )
          .set("Cookie", cookie);

        expect(response.status).toBe(404);
        expect(response.body.error).toContain(test.expectedError);
      }
    });

    it("should reject non-integer month numbers", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=2.5&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch("integer between 1 and 12");
    });

    it("should require both month and year parameters", async () => {
      const tests = [
        { query: "?month=February", expectedError: "required" },
        { query: "?year=2024", expectedError: "required" },
        { query: "", expectedError: "required" },
      ];

      for (const test of tests) {
        const response = await request
          .get(`/api/habit-categories/monthly-metrics${test.query}`)
          .set("Cookie", cookie);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(test.expectedError);
      }
    });

    it("should reject invalid year values", async () => {
      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=February&year=abc")
        .set("Cookie", cookie);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle February in leap year", async () => {
      // Add test records for February 29 in a leap year
      await createTestRecords(cookie, categoryId1, ["2024-02-29"]);

      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=February&year=2024")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.daysWithRecords).toBe(3); // Now includes 29th
    });

    it("should handle empty database", async () => {
      await clearMockDatabase();

      const response = await request
        .get("/api/habit-categories/monthly-metrics?month=May&year=2023")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.msg).toMatch("No categories found");
      expect(response.body.categoryCount).toBe(0);
    });
  });
});
