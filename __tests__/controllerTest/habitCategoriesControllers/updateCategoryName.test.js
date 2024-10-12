import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";
import User from "../../../models/userModels.js";
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
  let userId;
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

    userId = loginResponse.body.user._id; // Capture the user's id from the login response
    cookie = loginResponse.headers["set-cookie"]; // Capture session cookie

    logInfo(`Session cookie: ${cookie}`);

    // Step 3: Create a category to update later
    const newCategory = new HabitCategory({
      name: "Work",
      createdBy: userId,
      createdAt: new Date(),
    });

    const testCategory = await newCategory.save(); // Save category to the database
    categoryId = testCategory._id; // Capture the category ID
    logInfo(`CategoryId: ${categoryId}`);
  });

  it("should update the category name successfully if it follows the rules", async () => {
    const updateData = {
      name: "UpdatedName", // Nuevo nombre
    };

    const response = await request
      .patch(`/api/habit-categories/update/${categoryId}`)
      .set("Cookie", cookie) // Usar cookie de sesión
      .send(updateData); // Solo enviar el nuevo nombre

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Category name updated successfully.");
    expect(response.body.category.name).toBe(updateData.name);
  });
});
