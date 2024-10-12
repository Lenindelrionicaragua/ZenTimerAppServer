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

describe("Create a new habit-category (test route)", () => {
  let testUser;
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

    // Step 2: Log in with the created user to get the session cookie
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"]; // Capture session cookie

    logInfo(`Session cookie: ${cookie}`);
  });

  it("should create a new category if it does not exist (test route)", async () => {
    // Step 3: Create a new habit category
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

    // Step 4: Validate the creation response
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
  });

  it("should fail if the category name contains invalid characters", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Invalid@Name#",
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  it("should fail if the createdAt date is missing", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ValidName",
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Creation date is required.");
  });

  it("should fail if a category with the same name already exists", async () => {
    const category = {
      habitCategory: {
        name: "Work",
        createdAt: new Date(),
      },
    };

    // Create the first category
    await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(category);

    // Attempt to create the same category again
    const duplicateResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(category);

    // Validate response
    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.msg).toBe("Category already exists.");
  });

  it("should fail if habitCategory object is invalid or not provided", async () => {
    const invalidCategory = {
      habitCategory: null, // Invalid habitCategory object
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
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
        createdAt: new Date(),
        invalidField: "ThisShouldNotBeHere", // Invalid field
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(invalidCategory);

    // Validate response
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "Invalid request: the following properties are not allowed to be set: invalidField"
    );
  });

  it("should fail if the category name is too long (more than 15 characters)", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "ThisNameIsWayTooLong!",
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  it("should fail if the category name is empty", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "",
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the session cookie
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Category name is required.");
  });
});
