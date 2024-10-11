import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
import User from "../../../models/userModels.js";

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

describe("Update an existing habit-category name (test route)", () => {
  let testUser;
  let testUser2; // Second user for unauthorized tests
  let userId;
  let userId2; // Second user's ID
  let categoryId;

  beforeEach(async () => {
    // Step 1: Create a new user
    testUser = new User({
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    });

    await testUser.save(); // Save user to the database
    userId = testUser.id; // Capture the user's ID

    // Step 2: Create a second user
    testUser2 = new User({
      name: "Test User 2",
      email: "testuser2@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1991",
    });

    await testUser2.save(); // Save second user to the database
    userId2 = testUser2._id; // Capture the second user's ID

    // Step 3: Create a category to update later
    const newCategory = new HabitCategory({
      name: "Work",
      createdBy: userId, // Assign to the first user
      createdAt: new Date(),
    });

    const testCategory = await newCategory.save(); // Save category to the database
    categoryId = testCategory._id; // Capture the category ID
  });

  it("should update the category name successfully if it follows the rules", async () => {
    const updateData = {
      name: "UpdatedName",
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category name updated successfully.");
    expect(response.body.category.name).toBe(updateData.name);
  });

  it("should fail if the user is not the creator of the category", async () => {
    const invalidUpdate = {
      name: "NewName",
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser2.token}`) // Set the token of the second user
      .send(invalidUpdate);

    expect(response.status).toBe(403); // Expecting forbidden status
    expect(response.body.message).toBe(
      "Forbidden: You are not authorized to update this category."
    );
  });

  it("should fail if the new name exceeds 15 characters", async () => {
    const invalidUpdate = {
      name: "ThisNameIsWayTooLong!",
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  it("should fail if the new name is null", async () => {
    const invalidUpdate = {
      name: null,
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Category name is required.");
  });

  it("should fail if the userId is not a valid ObjectId", async () => {
    const invalidUpdate = {
      name: "NewName",
    };

    const response = await request
      .put(`/api/test/habit-categories/invalid-category-id/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "BAD REQUEST: Invalid category ID."
    );
  });

  it("should fail if the new name is not provided", async () => {
    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Category name is required.");
  });

  it("should fail if the new name contains invalid characters", async () => {
    const invalidUpdate = {
      name: "Invalid@Name#",
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks."
    );
  });

  it("should fail if the new name is the same as the current name", async () => {
    const invalidUpdate = {
      name: "Work", // Same name as the current name
    };

    const response = await request
      .put(`/api/test/habit-categories/${categoryId}/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "The new name must be different from the current name."
    );
  });

  it("should fail if the category to rename does not exist", async () => {
    const invalidUpdate = {
      name: "NewName",
    };

    const response = await request
      .put(`/api/test/habit-categories/non-existent-id/name`)
      .set("Authorization", `Bearer ${testUser.token}`) // Set the user's token for authentication
      .send(invalidUpdate);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Category not found.");
  });
});
