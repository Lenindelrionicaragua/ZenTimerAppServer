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

describe("Update an existing habit-category name (test route)", () => {
  let testUser;
  let testUserNotAuthorized;
  let categoryId;
  let invalidCategoryId;
  let cookie;
  let cookie2;

  beforeEach(async () => {
    // Step 1: Create and log in the first user
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

    logInfo(`Session cookie: ${cookie}`);

    // Step 2: Create a category to update later
    const newCategory = {
      habitCategory: {
        name: "Work!",
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(newCategory);

    categoryId = response.body.category._id;
    invalidCategoryId = "invalidCategoryId";
    logInfo(`CategoryTestId: ${JSON.stringify(categoryId)}`);

    // Step 3: Create and log in the second user (unauthorized user)
    testUserNotAuthorized = {
      name: "Test User2",
      email: "testuser2@example.com",
      password: "Test1234!2",
      dateOfBirth: "Tue Feb 01 1992",
    };

    await request
      .post("/api/auth/sign-up")
      .send({ user: testUserNotAuthorized });

    const loginResponse2 = await request.post("/api/auth/log-in").send({
      user: {
        email: testUserNotAuthorized.email,
        password: testUserNotAuthorized.password,
      },
    });

    cookie2 = loginResponse2.headers["set-cookie"]; // Capture session cookie for unauthorized user
    logInfo(`Session cookie2: ${cookie2}`);
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

  it("should fail if there are invalid fields in the request", async () => {
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

  it("should fail if the categoryId is invalid", async () => {
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

  it("should fail if the category is not found", async () => {
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

  it("should fail if the user is not authorized to update the category", async () => {
    const updateData = {
      name: "UpdatedName",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie2) // Use unauthorized user's cookie
      .send(updateData);

    expect(response.status).toBe(403); // Unauthorized action
    expect(response.body.message).toBe(
      "Forbidden: You are not authorized to update this category."
    );
  });

  it("should fail if the new category name is the same as the current name", async () => {
    const updateData = {
      name: "Work!",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie) // Use authorized user's cookie
      .send(updateData);

    expect(response.status).toBe(400); // Name validation error
    expect(response.body.message).toBe(
      "The new name must be different from the current name (case-insensitive)."
    );
  });

  it("should fail if the new name exceeds the character limit", async () => {
    const updateData = {
      name: "ThisNameIsWayTooLong",
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

  it("should fail if the new name contains disallowed special characters", async () => {
    const updateData = {
      name: "Invalid@Name",
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

  it("should fail if the new category name is the same as the current name but with different casing", async () => {
    const updateData = {
      name: "work!", // Same as "Work!" but different casing
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "The new name must be different from the current name (case-insensitive)."
    );
  });

  it("should fail if attempting to update non-allowed fields like createdBy", async () => {
    const updateData = {
      name: "UpdatedName",
      createdBy: "someOtherUserId",
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "BAD REQUEST: the following properties are not allowed to be set: createdBy"
    );
  });

  it("should succeed if the new category name has valid case changes that are not exactly the same", async () => {
    const updateData = {
      name: "WorkHard!", // Different name
    };

    const response = await request
      .patch(`/api/habit-categories/${categoryId}/name`)
      .set("Cookie", cookie)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category name updated successfully.");
    expect(response.body.category.name).toBe(updateData.name);
  });
});
