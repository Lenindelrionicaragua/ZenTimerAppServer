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

describe("Daily Record Creation Tests", () => {
  let testUser;
  let testUserId;
  let cookie;
  let categoryId;
  let dailyRecordId;

  const firstMinutesUpdate = 45; // Initial minutes update for the first record

  beforeEach(async () => {
    // Preparing test user data for sign-up and login
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

    // Create a habit category
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
    logInfo(`Category created by user: ${JSON.stringify(testUserId)}`);

    // Create the initial daily record for the user
    const dailyRecordData = {
      minutesUpdate: firstMinutesUpdate,
      date: "2024-10-12", // Valid date format
    };

    const dailyRecordResponse = await request
      .post(`/api/daily-records/${testUserId}/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    dailyRecordId = dailyRecordResponse.body.record._id;
    logInfo(`DailyRecord created with id: ${JSON.stringify(dailyRecordId)}`);
  });

  it("should update the existing daily record", async () => {
    const newMinutesUpdate = 20;
    const response = await request
      .post(`/api/daily-records/${testUserId}/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        minutesUpdate: newMinutesUpdate,
        date: "2024-10-12",
      });

    expect(response.status).toBe(200); // OK
    expect(response.body.success).toBe(true);
    expect(response.body.record.totalDailyMinutes).toBe(
      firstMinutesUpdate + newMinutesUpdate
    );
  });

  it("should return 400 if minutesUpdate is missing", async () => {
    const response = await request
      .post(`/api/daily-records/${testUserId}/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        date: "2024-10-12",
      });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.errors).toContain("minutesUpdate is required.");
  });

  it("should return 400 if date format is invalid", async () => {
    const response = await request
      .post(`/api/daily-records/${testUserId}/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        minutesUpdate: 25,
        date: "12-10-2024", // Invalid date format
      });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.errors).toContain(
      "Date must be in a valid ISO format (YYYY-MM-DD)."
    );
  });
});
