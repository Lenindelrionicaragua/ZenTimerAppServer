import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";

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

describe("Create a new habit-category (test route)", () => {
  let testUser;
  let userId;

  beforeEach(async () => {
    // Step 1: Create a new user
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Step 2: Log in with the created user to get the userId (skip token here for simplicity)
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id; // Capture the user's id from the login response
  });

  it("should create a new category if it does not exist (test route)", async () => {
    // Step 3: Create a new habit category using the captured userId
    const newCategory = {
      habitCategory: {
        name: "Work!",
        createdBy: userId, // Use the user id from login response
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    // Using the test route here
    const response = await request
      .post("/api/test/habit-categories/create")
      .send(newCategory);

    // Step 4: Validate the creation response
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
    expect(response.body.category.createdBy).toEqual(userId);
    expect(response.body.category.totalMinutes).toBe(
      newCategory.habitCategory.totalMinutes
    );
  });
});
