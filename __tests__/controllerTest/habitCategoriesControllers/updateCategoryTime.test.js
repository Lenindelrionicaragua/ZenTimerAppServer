import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";

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
      dailyRecords: [], // Initialize dailyRecords as an empty array
      createdAt: new Date(),
    });
    await testCategory.save();
    categoryId = testCategory._id;
  });

  it("should successfully update today's record with new minutes", async () => {
    const updateData = { minutes: 30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category time updated successfully.");

    // Verify that the daily record for today has been created
    const updatedCategory = await HabitCategory.findById(categoryId);
    expect(updatedCategory.dailyRecords.length).toBe(1); // Expecting one daily record
    expect(updatedCategory.dailyRecords[0].minutes).toBe(30); // The minutes should be 30
  });

  it("should create a new daily record if none exists for today", async () => {
    await HabitCategory.updateOne(
      { _id: categoryId },
      { $set: { dailyRecords: [] } }
    );

    const updateData = { minutes: 40 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category time updated successfully.");

    const updatedCategory = await HabitCategory.findById(categoryId);
    expect(updatedCategory.dailyRecords.length).toBe(1);
    expect(updatedCategory.dailyRecords[0].minutes).toBe(40);
  });

  it("should add minutes to an existing record for today", async () => {
    // Create an initial daily record for today
    const initialRecord = { date: new Date(), minutes: 20 };
    testCategory.dailyRecords.push(initialRecord);
    await testCategory.save();

    // Add more minutes today
    const updateData = { minutes: 15 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category time updated successfully.");

    const updatedCategory = await HabitCategory.findById(categoryId);
    expect(updatedCategory.dailyRecords.length).toBe(1); // Still one daily record
    expect(updatedCategory.dailyRecords[0].minutes).toBe(35); // 20 + 15
  });

  it("should successfully update today's record with new minutes", async () => {
    const updateData = { minutes: 30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category time updated successfully.");

    // Verify that the daily record for today has been created
    const updatedCategory = await HabitCategory.findById(categoryId);
    expect(updatedCategory.dailyRecords.length).toBe(1);
    expect(updatedCategory.dailyRecords[0].minutes).toBe(30);
  });

  it("should successfully add minutes to today's existing record", async () => {
    const initialRecord = { date: new Date(), minutes: 20 };
    testCategory.dailyRecords.push(initialRecord);
    await testCategory.save();

    const updateData = { minutes: 15 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category time updated successfully.");

    const updatedCategory = await HabitCategory.findById(categoryId);
    expect(updatedCategory.dailyRecords.length).toBe(1);
    expect(updatedCategory.dailyRecords[0].minutes).toBe(35); // 20 + 15
  });

  it("should return an error if minutes is negative", async () => {
    const updateData = { minutes: -30 };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error if minutes is null", async () => {
    const updateData = { minutes: null };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error when minutes is missing in the request body", async () => {
    const updateData = {};

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error when there is an invalid categoryId", async () => {
    const updateData = { minutes: 30 };
    const invalidCategoryId = "1234";

    const response = await request
      .put(`/api/test/habit-categories/${invalidCategoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("BAD REQUEST: Invalid category ID.");
  });

  it("should return an error when categoryId does not exist", async () => {
    const updateData = { minutes: 30 };
    const nonExistentCategoryId = "60d5ec49c88e1f15c485f8d7";

    const response = await request
      .put(`/api/test/habit-categories/${nonExistentCategoryId}`)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Category not found.");
  });

  it("should return an error if minutes is Infinity", async () => {
    const updateData = { minutes: Infinity };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error if minutes is NaN", async () => {
    const updateData = { minutes: NaN };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error if minutes is a non-numeric string", async () => {
    const updateData = { minutes: "invalid" };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });

  it("should return an error if minutes is the string 'Infinity'", async () => {
    const updateData = { minutes: "Infinity" };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Minutes must be a non-negative finite number."
    );
  });
});
