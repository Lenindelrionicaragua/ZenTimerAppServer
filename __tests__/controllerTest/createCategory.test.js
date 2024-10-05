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

  it("should fail if the category name contains invalid characters", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Invalid@Name#",
        createdBy: userId,
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks"
    );
  });

  it("should fail if createdBy is not a valid ObjectId", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: "invalid-object-id", // Invalid ObjectId format
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    // Check for 400 status instead of 500
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("'createdBy' must be a valid ObjectId");
  });

  it("should fail if createdBy is null", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: null,
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Creator is required.");
  });

  it("should fail if createdBy is not a valid ObjectId", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: "invalid-object-id", // Invalid ObjectId format
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    // Check for 400 status instead of 500
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("'createdBy' must be a valid ObjectId");
  });

  it("should fail if the createdAt date is missing", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: userId,
        totalMinutes: 120,
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Creation date is required.");
  });

  it("should fail if totalMinutes is negative", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: userId,
        totalMinutes: -10,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Total minutes cannot be negative.");
  });
});
