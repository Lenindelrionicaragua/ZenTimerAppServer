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
  let cookie;

  beforeEach(async () => {
    // Step 1: Create a new user
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Step 2: Log in with the created user to get the userId and session cookie
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"]; // Capture session cookie

    logInfo(`Session cookie: ${cookie}`);

    // Step 3: Create a category to update later
    const newCategory = {
      habitCategory: {
        name: "Work!",
        createdAt: new Date(),
      },
    };

    // Using the test route here
    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(newCategory);

    // const userId = response.body.category.createdBy;
    categoryId = response.body.category._id;
    logInfo(`CategoryTestId: ${JSON.stringify(categoryId)}`);
    // logInfo(`UserId: ${JSON.stringify(userId)}`);
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
});
