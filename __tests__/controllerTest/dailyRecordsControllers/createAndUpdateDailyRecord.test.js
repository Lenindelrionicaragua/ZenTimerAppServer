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

  beforeEach(async () => {
    // Preparing test user data for sign up and login
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
  });

  it("should create a daily record for the user and category", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12", // Valid date format
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(201); // Created
    expect(response.body.success).toBe(true);
    expect(response.body.record.totalDailyMinutes).toBe(
      dailyRecordData.minutesUpdate
    );
    expect(response.body.record.date).toBe("2024-10-12T00:00:00.000Z");
    expect(response.body.record.userId).toBe(testUserId);
    expect(response.body.record.categoryId).toBe(categoryId);
  });

  it("should fail if the date is not in a valid format", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "Monday, 15 of December", // Invalid date format
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to invalid format
    expect(response.body.errors).toContain(
      "Date must be in a valid ISO format (YYYY-MM-DD)."
    );
  });

  it("should fail if the date is null", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: null, // Invalid date
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to null date
    expect(response.body.errors).toContain(
      "Date cannot be null or an empty string."
    );
  });

  it("should fail if the date is an empty string", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "", // Empty date string
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to empty date
    expect(response.body.errors).toContain(
      "Date cannot be null or an empty string."
    );
  });

  it("should fail if the categoryId is invalid (non-objectId)", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const InvalidCategoryId = "invalidIdObject";

    const response = await request
      .post(`/api/daily-records/${InvalidCategoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to invalid categoryId
    expect(response.body.errors).toContain(
      "categoryId must be a valid ObjectId."
    );
  });

  it("should fail if the categoryId is null", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const nullCategoryId = null;

    const response = await request
      .post(`/api/daily-records/${nullCategoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to null categoryId
    expect(response.body.errors).toContain(
      "categoryId must be a valid ObjectId."
    );
  });

  it("should fail if the categoryId is an empty string", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const emptyCategoryId = "";

    const response = await request
      .post(`/api/daily-records/${emptyCategoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(404); // Not found due to empty categoryId causing route mismatch
  });

  it("should fail if the user is not authenticated", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", "") // No cookie (not authenticated)
      .send(dailyRecordData);

    expect(response.status).toBe(401); // Unauthorized due to no authentication
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe("BAD REQUEST: Authentication required.");
  });

  it("should fail if minutesUpdate is missing", async () => {
    const dailyRecordData = {
      date: "2024-10-12", // Missing minutesUpdate
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    // Expect a 400 Bad Request status due to missing parameter
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain("minutesUpdate is required.");
  });

  it("should correctly store userId and categoryId in the created record", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12", // Valid date
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    // Expect a 201 status indicating successful creation
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    // Verify that the created record contains the correct userId and categoryId
    expect(response.body.record.userId).toBe(testUserId);
    expect(response.body.record.categoryId).toBe(categoryId);
  });

  it("should fail if minutesUpdate is not a number", async () => {
    const invalidDailyRecordData = {
      minutesUpdate: "invalid", // Not a number
      date: "2024-10-12",
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(invalidDailyRecordData);

    // Expect a 400 status due to invalid type of minutesUpdate
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain("minutesUpdate must be a number.");
  });

  it("should store date in correct ISO format", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12", // Valid date
    };

    const response = await request
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    // Expect a 201 status indicating successful creation
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    // Verify that the date is stored in ISO format
    expect(response.body.record.date).toBe("2024-10-12T00:00:00.000Z");
  });
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
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    dailyRecordId = dailyRecordResponse.body.record._id;
    logInfo(`DailyRecord created with id: ${JSON.stringify(dailyRecordId)}`);
  });

  it("should update the existing daily record", async () => {
    const newMinutesUpdate = 20;
    const response = await request
      .post(`/api/daily-records/${categoryId}`)
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
      .post(`/api/daily-records/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        date: "2024-10-12",
      });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.errors).toContain("minutesUpdate is required.");
  });

  it("should return 400 if date format is invalid", async () => {
    const response = await request
      .post(`/api/daily-records/${categoryId}`)
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
