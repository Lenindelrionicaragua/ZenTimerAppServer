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

  it("should delete all categories for the user using deleteAllCategories", async () => {
    // Send delete request to remove all categories
    const deleteResponse = await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.msg).toBe(
      "All categories and their associated records have been deleted."
    );

    // Verify that all categories have been deleted
    const remainingCategories = await HabitCategory.find({});
    expect(remainingCategories.length).toBe(0);

    // Verify that all daily records associated with the user  have been deleted
    const remainingRecords = await DailyTimeRecord.find({ userId: createdBy });
    expect(remainingRecords.length).toBe(0);
  });

  it("should return 404 when the user has no categories", async () => {
    // delete the default categories
    await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    const deleteResponse = await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body.success).toBe(false);
    expect(deleteResponse.body.msg).toBe("No categories found for the user.");
  });

  it("should return 500 if there is a database error", async () => {
    jest.spyOn(HabitCategory, "find").mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const deleteResponse = await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    expect(deleteResponse.status).toBe(500);
    expect(deleteResponse.body.success).toBe(false);
    expect(deleteResponse.body.msg).toBe(
      "An error occurred while deleting all categories."
    );
  });

  it("should return 400 if user ID is not authenticated", async () => {
    const deleteResponse = await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", "");

    expect(deleteResponse.status).toBe(401);
    expect(deleteResponse.body.success).toBe(false);
    expect(deleteResponse.body.msg).toBe(
      "UBAD REQUEST: Authentication required."
    );
  });
});
