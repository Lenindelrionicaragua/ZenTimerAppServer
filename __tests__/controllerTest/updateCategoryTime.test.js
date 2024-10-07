import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import HabitCategory from "../../models/habitCategory.js";

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

describe("Update category time", () => {
  let testCategory;
  let categoryId;

  beforeEach(async () => {
    testCategory = new HabitCategory({
      name: "Work",
      createdBy: "633a1a0e6d28b961a3e5ffdd",
      totalMinutes: 60,
      createdAt: new Date(),
    });
    await testCategory.save();
    categoryId = testCategory._id;
  });

  it("should successfully update the total minutes of the category", async () => {
    const updateData = { totalMinutes: 30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category updated successfully.");
    expect(response.body.category.totalMinutes).toBe(
      testCategory.totalMinutes + updateData.totalMinutes
    );
  });

  it("should return an error if totalMinutes is negative", async () => {
    const updateData = { totalMinutes: -30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Total minutes cannot be negative."
    );
  });

  it("should return an error if totalMinutes is null", async () => {
    const updateData = { totalMinutes: null };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Total minutes is required."
    );
  });

  it("should return an error if totalMinutes is < 24 hours", async () => {
    const updateData = { totalMinutes: 1600 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Total minutes cannot exceed 1440 minutes (24 hours)."
    );
  });

  it("should return an error when totalMinutes is missing in the request body", async () => {
    const updateData = {};

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Total minutes is required."
    );
  });

  it("should return an error when there is an invalid categoryId", async () => {
    const updateData = { totalMinutes: 30 };
    const invalidCategoryId = "1234";

    const response = await request
      .put(`/api/test/habit-categories/${invalidCategoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("BAD REQUEST: Invalid category ID.");
  });
});
