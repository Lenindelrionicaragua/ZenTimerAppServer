import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
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

describe("Update an existing habit-category name (test route)", () => {
  let testUser;
  let categoryId;
  let invalidCategoryId;
  let cookie;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"]; // Capture session cookie

    // delete the default categories
    await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    const newCategory = {
      habitCategory: {
        name: "Work!",
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    categoryId = response.body.category._id;
    invalidCategoryId = "invalidCategoryId";
  });

  it("should update the category name successfully if it follows the rules", async () => {
    const updateData = {
      name: "UpdatedName",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category name updated successfully.");
    expect(response.body.category.name).toBe(updateData.name);
  });

  it("should fail if the new name is null", async () => {
    const updateData = {
      name: null,
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Category name is required."
    );
  });

  it("should fail if the new name is an empty object", async () => {
    const updateData = {};

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Category name is required."
    );
  });

  it("should fail if there are invalid fields", async () => {
    const updateData = {
      name: "UpdatedName",
      invalidField: "invalidField",
      invalidField2: "",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: the following properties are not allowed to be set: invalidField, invalidField2"
    );
  });

  it("should fail if the category ID is invalid", async () => {
    const updateData = {
      name: "UpdatedName",
    };

    const response = await request
      .patch(`/api/habit-categories/${invalidCategoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("BAD REQUEST: Invalid category ID.");
  });

  it("should fail if category is not found", async () => {
    const nonExistentCategoryId = "670bb3ec4da2044da7b7d8f7";

    const updateData = {
      name: "UpdatedName",
    };

    const response = await request
      .patch(`/api/habit-categories/${nonExistentCategoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Category not found.");
  });

  it("should fail if user is not authorized to update the category", async () => {
    const testUser2 = {
      name: "Test User 2",
      email: "testuser2@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1992",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser2 });

    const loginResponse2 = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser2.email, password: testUser2.password } });

    const cookie2 = loginResponse2.headers["set-cookie"]; // Capture session cookie

    const updateData = {
      name: "UnauthorizedUpdate",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie2)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Forbidden: You are not authorized to update this category."
    );
  });

  it("should fail if the new name contains invalid characters", async () => {
    const updateData = {
      name: "Invalid@Name", // Contains an invalid character '@'
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  it("should fail if the new name exceeds 15 characters", async () => {
    const updateData = {
      name: "ThisNameIsWayTooLong", // Exceeds 15 characters
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });
});
