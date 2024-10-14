import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";

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

describe("Daily Record Creation Test", () => {
  let testUser;
  let testUserId;
  let cookie;
  let categoryId;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // User sign-up
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // User login
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];

    // Create a category
    const newCategory = {
      habitCategory: {
        name: "Exercise",
      },
    };

    const categoryResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    categoryId = categoryResponse.body.category._id;
    testUserId = categoryResponse.body.category.createdBy;
    logInfo(`CategoryResponse: ${JSON.stringify(testUserId)}`);
  });

  it("should create a daily record for the user and category", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    // Adjusted URL based on router definition
    const response = await request
      .post(`/api/daily-records/${testUserId}/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.record.totalDailyMinutes).toBe(
      dailyRecordData.minutesUpdate
    );

    expect(response.body.record.date).toBe("2024-10-12T00:00:00.000Z");
    expect(response.body.record.userId).toBe(testUserId);
    expect(response.body.record.categoryId).toBe(categoryId);
  });

  //   it("should fail if invalid minutesUpdate is provided", async () => {
  //     const invalidDailyRecordData = {
  //       minutesUpdate: -10, // Invalid minutes (negative)
  //       date: "2024-10-12",
  //     };

  //     // Adjusted URL to match the correct route
  //     const response = await request
  //       .post(`/api/daily-records/${testUser._id}/${categoryId}`)
  //       .set("Cookie", cookie)
  //       .send(invalidDailyRecordData);

  //     expect(response.status).toBe(400);
  //     expect(response.body.success).toBe(false);
  //     expect(response.body.errors).toContain(
  //       "minutesUpdate must be between 0 and 1440 (24 hours in minutes)."
  //     );
  //   });

  //   it("should fail if the user is not authenticated", async () => {
  //     const dailyRecordData = {
  //       minutesUpdate: 45,
  //       date: "2024-10-12",
  //     };

  //     // Adjusted URL to match the correct route
  //     const response = await request
  //       .post(`/api/daily-records/${testUser._id}/${categoryId}`)
  //       .set("Cookie", "") // No cookie (not authenticated)
  //       .send(dailyRecordData);

  //     expect(response.status).toBe(401);
  //     expect(response.body.success).toBe(false);
  //     expect(response.body.msg).toBe("BAD REQUEST: Authentication required.");
  //   });
});
