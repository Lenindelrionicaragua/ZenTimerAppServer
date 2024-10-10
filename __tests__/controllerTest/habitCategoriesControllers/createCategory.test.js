import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";

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

  it("should fail if a category with the same name already exists", async () => {
    const category = {
      habitCategory: {
        name: "Work",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
    };

    // Create the first category
    await request.post("/api/test/habit-categories/create").send(category);

    // Attempt to create the same category again
    const duplicateResponse = await request
      .post("/api/test/habit-categories/create")
      .send(category);

    // Validate response
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.msg).toBe(
      "Category already exists for this user."
    );
  });

  it("should fail if the category name contains invalid characters", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Invalid@Name#", // Contains invalid characters
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
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

  it("should fail if the category name exceeds 15 characters", async () => {
    const longCategory = {
      habitCategory: {
        name: "ThisCategoryNameIsWayTooLong",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(longCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  it("should create a new category if it does not exist (test route)", async () => {
    // Step 3: Create a new habit category using the captured userId
    const newCategory = {
      habitCategory: {
        name: "Work!",
        createdBy: userId, // Use the user id from login response
        createdAt: new Date(),
        dailyRecords: [], // Empty daily records for new category
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
    expect(response.body.category.dailyRecords).toEqual([]);
  });

  it("should fail if the category name contains invalid characters", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Invalid@Name#",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
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

  it("should fail if createdBy is null", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
        createdBy: null,
        createdAt: new Date(),
        dailyRecords: [],
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
        createdAt: new Date(),
        dailyRecords: [],
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
        dailyRecords: [],
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Creation date is required.");
  });

  it("should fail if habitCategory object is invalid or not provided", async () => {
    const invalidCategory = {
      habitCategory: null, // Invalid habitCategory object
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    // Validate response
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "Invalid request: You need to provide a valid 'habitCategory' object."
    );
  });

  it("should fail if habitCategory contains invalid fields", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Exercise",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
        invalidField: "ThisShouldNotBeHere", // Invalid field
      },
    };

    const response = await request
      .post("/api/test/habit-categories/create")
      .send(invalidCategory);

    // Validate response
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "Invalid request: the following properties are not allowed to be set: invalidField"
    );
  });
});

describe("Category Limit Tests", () => {
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

    // Step 2: Log in with the created user to get the userId
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    userId = loginResponse.body.user.id; // Capture the user's id from the login response

    // Step 3: Create 7 categories
    const categories = [
      {
        name: "Category 1",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 2",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 3",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 4",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 5",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 6",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
      {
        name: "Category 7",
        createdBy: userId,
        createdAt: new Date(),
        dailyRecords: [],
      },
    ];

    for (const category of categories) {
      await request.post("/api/test/habit-categories/create").send({
        habitCategory: category, // This should now include all required fields
      });
    }
  });

  it("should not allow creating more than 7 categories", async () => {
    // Attempt to create the 8th category
    const response = await request
      .post("/api/test/habit-categories/create")
      .send({
        habitCategory: {
          name: "Category 8",
          createdBy: userId,
          createdAt: new Date(),
          dailyRecords: [],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "You have reached the maximum limit of 7 categories allowed."
    );
  });
});
