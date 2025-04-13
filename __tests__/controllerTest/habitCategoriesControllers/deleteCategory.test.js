import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
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

describe("deleteAllCategories Endpoint Tests", () => {
  let testUser;
  let cookie;
  let categoryIds = [];

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
    const userId = loginResponse.body.user.id;

    // Fetch categories and select the first three for testing
    const getCategoryResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    // Get the first three category IDs and createdBy field
    categoryIds = getCategoryResponse.body.categories
      .slice(0, 3)
      .map((c) => c.id);

    // Create daily records associated with the categories
    const dailyTimeRecords = categoryIds.map((id, index) => ({
      userId: userId,
      categoryId: id,
      totalDailyMinutes: 30 + index * 10, // Different minutes for diversity
      date: `2023-10-0${index + 1}`,
    }));

    // Save daily records
    await DailyTimeRecord.insertMany(dailyTimeRecords);
  });

  it("should delete the category if it exists", async () => {
    const response = await request
      .delete(`/api/habit-categories/${categoryIds[0]}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "The category and all its associated records have been deleted.",
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
      "The category you are trying to delete does not exist.",
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
      "An error occurred while deleting the category.",
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
      "An error occurred while deleting the category.",
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
      .delete(`/api/habit-categories/${categoryIds[0]}`)
      .set("Cookie", "");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe("BAD REQUEST: Authentication required.");
    expect(response.body.category).toBeUndefined();
  });

  it("should delete the category and all associated daily records", async () => {
    // Confirm that the daily records exist before deletion
    const recordsBeforeDeletion = await DailyTimeRecord.find({
      categoryId: categoryIds[0],
    });
    expect(recordsBeforeDeletion.length).toBe(1); // Should have 1 daily record

    // Send delete request to remove category and associated records
    const response = await request
      .delete(`/api/habit-categories/${categoryIds[0]}`)
      .set("Cookie", cookie);

    expect(response.status).toBe(200); // Successful deletion
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "The category and all its associated records have been deleted.",
    );

    // Check that the category no longer exists
    const categoryAfterDeletion = await HabitCategory.findById(categoryIds[0]);
    expect(categoryAfterDeletion).toBeNull(); // Category should be deleted

    // Check that the associated daily records are deleted
    const recordsAfterDeletion = await DailyTimeRecord.find({
      categoryId: categoryIds[0],
    });
    expect(recordsAfterDeletion.length).toBe(0); // All records should be deleted
  });

  it("should fail when attempting to delete an already deleted category", async () => {
    await request
      .delete(`/api/habit-categories/${categoryIds[0]}`)
      .set("Cookie", cookie);

    const secondDeletionResponse = await request
      .delete(`/api/habit-categories/${categoryIds[0]}`)
      .set("Cookie", cookie);

    expect(secondDeletionResponse.status).toBe(404);
    expect(secondDeletionResponse.body.success).toBe(false);
    expect(secondDeletionResponse.body.msg).toBe(
      "The category you are trying to delete does not exist.",
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
      "An error occurred while deleting the category.",
    ); // mongoose response
  });
});
