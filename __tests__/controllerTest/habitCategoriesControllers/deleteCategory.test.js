import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import { logInfo } from "../../../util/logging.js";
import HabitCategory from "../../../models/habitCategory.js";
import DailyTimeRecord from "../../../models/dailyTimeRecord.js";

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

describe("Habit Category Deletion Tests", () => {
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

    // Create daily records associated with the category
    const dailyTimeRecords = [
      {
        userId: categoryResponse.body.category.createdBy,
        categoryId: categoryId,
        totalDailyMinutes: 60,
        date: "2023-10-01",
      },
      {
        userId: categoryResponse.body.category.createdBy,
        categoryId: categoryId,
        totalDailyMinutes: 30,
        date: "2023-10-02",
      },
    ];

    // Save daily records
    await DailyTimeRecord.insertMany(dailyTimeRecords);
  });

  it("should delete the category if it exists", async () => {
    const response = await request
      .delete(`/api/habit-categories/${categoryId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "The category and all its associated records have been deleted."
    );
    expect(response.body.category).toBeUndefined();
  });

  it("should fail if the category does not exist", async () => {
    const invalidCategory = "670e723eae6dff077905ee21";

    const response = await request
      .delete(`/api/habit-categories/${invalidCategory}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "The category you are trying to delete does not exist."
    );
    expect(response.body.category).toBeUndefined();
  });

  it("should fail if the category ID is null", async () => {
    const invalidCategory = null;

    const response = await request
      .delete(`/api/habit-categories/${invalidCategory}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "An error occurred while deleting the category."
    );
    expect(response.body.category).toBeUndefined();
  });

  it("should fail if the category ID is an empty object", async () => {
    const invalidCategory = {};

    const response = await request
      .delete(`/api/habit-categories/${invalidCategory}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "An error occurred while deleting the category."
    );
    expect(response.body.category).toBeUndefined();
  });

  it("should fail if the category ID is an empty string", async () => {
    const invalidCategory = "";

    const response = await request
      .delete(`/api/habit-categories/${invalidCategory}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(404); // Not found due to empty categoryId causing route mismatch
  });

  it("should fail if the user is not authenticated", async () => {
    const response = await request
      .delete(`/api/habit-categories/${categoryId}`)
      .set("Cookie", "");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe("BAD REQUEST: Authentication required.");
    expect(response.body.category).toBeUndefined();
  });

  it("should delete the category and all associated daily records", async () => {
    // Confirm that the daily records exist before deletion
    let recordsBeforeDeletion = await DailyRecord.find({ categoryId });
    expect(recordsBeforeDeletion.length).toBe(2); // Should have 2 daily records

    // Send delete request to remove category and associated records
    const response = await request
      .delete(`/api/habit-categories/${categoryId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200); // Successful deletion
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "The category and all its associated records have been deleted."
    );

    // Check that the category no longer exists
    const categoryAfterDeletion = await HabitCategory.findById(categoryId);
    expect(categoryAfterDeletion).toBeNull(); // Category should be deleted

    // Check that the associated daily records are deleted
    let recordsAfterDeletion = await DailyRecord.find({ categoryId });
    expect(recordsAfterDeletion.length).toBe(0); // All daily records should be deleted
  });

  it("should fail when attempting to delete an already deleted category", async () => {
    await request
      .delete(`/api/habit-categories/${categoryId}`)
      .set("Cookie", cookie);
    const secondDeletionResponse = await request
      .delete(`/api/habit-categories/${categoryId}`)
      .set("Cookie", cookie);

    expect(secondDeletionResponse.status).toBe(404);
    expect(secondDeletionResponse.body.success).toBe(false);
    expect(secondDeletionResponse.body.msg).toBe(
      "The category you are trying to delete does not exist."
    );
  });

  it("should fail if the categoryId is not a valid ObjectId", async () => {
    const invalidCategoryId = "123-invalid-id";

    const response = await request
      .delete(`/api/habit-categories/${invalidCategoryId}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "An error occurred while deleting the category."
    ); // mongoose response
  });
});
