import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
import DailyTimeRecord from "../../../models/dailyTimeRecord.js";
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

describe("deleteAllCategories Endpoint Tests", () => {
  let testUser;
  let cookie;
  let categoryId1,
    categoryId2,
    categoryId3,
    categoryId4,
    categoryId5,
    categoryId6;
  let createdBy;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // Sign up a new user
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Log in the user
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];

    // Fetch categories
    const getCategoryResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    [
      categoryId1,
      categoryId2,
      categoryId3,
      categoryId4,
      categoryId5,
      categoryId6,
    ] = getCategoryResponse.body.categories.map((c) => c.id);

    createdBy = getCategoryResponse.body.categories[0].createdBy;

    // logInfo({
    //   categoryId1,
    //   categoryId2,
    //   categoryId3,
    //   categoryId4,
    //   categoryId5,
    //   categoryId6,
    // });

    // logInfo(createdBy);

    // Create daily records associated with the category
    const dailyTimeRecords = [
      {
        userId: createdBy,
        categoryId: categoryId1,
        totalDailyMinutes: 60,
        date: "2023-10-01",
      },
      {
        userId: createdBy,
        categoryId: categoryId2,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
      {
        userId: createdBy,
        categoryId: categoryId3,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
      {
        userId: createdBy,
        categoryId: categoryId4,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
      {
        userId: createdBy,
        categoryId: categoryId5,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
      {
        userId: createdBy,
        categoryId: categoryId6,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
    ];

    // Save daily records
    await DailyTimeRecord.insertMany(dailyTimeRecords);
  });

  it("should create a daily record for the user and category", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12", // Valid date format
    };

    const response = await request
      .post(`/api/time-records/${categoryId1}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(201); // Created
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("Daily record created successfully.");
  });

  it("should fail if the date is not in a valid format", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "Monday, 15 of December", // Invalid date format
    };

    const response = await request
      .post(`/api/time-records/${categoryId1}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to invalid format
    expect(response.body.errors).toContain(
      "Date must be in a valid ISO format."
    );
  });

  it("should pass even if the date is null", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: null,
    };

    const response = await request
      .post(`/api/time-records/${categoryId3}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(201); // Bad request due to null date
  });

  it("should pass even if the date is an empty string", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "", // Empty date string
    };

    const response = await request
      .post(`/api/time-records/${categoryId2}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(201); // Bad request due to empty date
  });

  it("should fail if the categoryId is invalid (non-objectId)", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const InvalidCategoryId = "invalidIdObject";

    const response = await request
      .post(`/api/time-records/${InvalidCategoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to invalid categoryId
    expect(response.body.errors).toContain(
      "categoryId must be a valid 24-character string."
    );
  });

  it("should fail if the categoryId is null", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const nullCategoryId = null;

    const response = await request
      .post(`/api/time-records/${nullCategoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    expect(response.status).toBe(400); // Bad request due to null categoryId
    expect(response.body.errors).toContain(
      "categoryId must be a valid 24-character string."
    );
  });

  it("should fail if the categoryId is an empty string", async () => {
    const dailyRecordData = {
      minutesUpdate: 45,
      date: "2024-10-12",
    };

    const emptyCategoryId = "";

    const response = await request
      .post(`/api/time-records/${emptyCategoryId}`)
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
      .post(`/api/time-records/${categoryId4}`)
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
      .post(`/api/time-records/${categoryId4}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);

    // Expect a 400 Bad Request status due to missing parameter
    expect(response.status).toBe(400);
    // expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain("minutesUpdate is required.");
  });

  it("should fail if minutesUpdate is not a number", async () => {
    const invalidDailyRecordData = {
      minutesUpdate: "invalid", // Not a number
      date: "2024-10-12",
    };

    const response = await request
      .post(`/api/time-records/${categoryId3}`)
      .set("Cookie", cookie)
      .send(invalidDailyRecordData);

    // Expect a 400 status due to invalid type of minutesUpdate
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain("minutesUpdate must be a number.");
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

    await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    // Create a habit category
    const newCategory = {
      habitCategory: {
        name: "NewCategory",
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
      .post(`/api/time-records/${categoryId}`)
      .set("Cookie", cookie)
      .send(dailyRecordData);
  });

  it("should update the existing daily record", async () => {
    const newMinutesUpdate = 20;
    const response = await request
      .post(`/api/time-records/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        minutesUpdate: newMinutesUpdate,
        date: "2024-10-12",
      });

    expect(response.status).toBe(200); // OK
    expect(response.body.success).toBe(true);
  });

  it("should return 400 if minutesUpdate is missing", async () => {
    const response = await request
      .post(`/api/time-records/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        date: "2024-10-12",
      });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.errors).toContain("minutesUpdate is required.");
  });

  it("should return 400 if date format is invalid", async () => {
    const response = await request
      .post(`/api/time-records/${categoryId}`)
      .set("Cookie", cookie)
      .send({
        minutesUpdate: 25,
        date: "invalid",
      });

    expect(response.status).toBe(400); // Bad Request
    expect(response.body.errors).toContain(
      "Date must be in a valid ISO format."
    );
  });
});
