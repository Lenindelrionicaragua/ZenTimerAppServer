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
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // User sign-up
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // User login
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];
  });

  it("should create a new category if it does not exist", async () => {
    const newCategory = {
      habitCategory: {
        name: "Meditation",
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
    expect(response.body.category.createdAt).toBeDefined(); // createdAt should be set automatically
    expect(response.body.category.dailyGoal).toBe(0); // dailyGoal should be 0 by default
  });

  it("should create a new category with a specified dailyGoal", async () => {
    const newCategory = {
      habitCategory: {
        name: "NewCategory",
        dailyGoal: 20,
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
    expect(response.body.category.dailyGoal).toBe(
      newCategory.habitCategory.dailyGoal
    ); // Check that dailyGoal is correctly set
  });

  it("should fail if the dailyGoal is more than 1440 minutes", async () => {
    const newCategory = {
      habitCategory: {
        name: "NewCategory",
        dailyGoal: 1600, // Exceeds the limit
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Daily goal cannot exceed 1440 minutes (24 hours)."
    ); // Adjust based on your validation logic
  });

  it("should fail if the dailyGoal is less than 15 minutes", async () => {
    const newCategory = {
      habitCategory: {
        name: "NewCategory",
        dailyGoal: 14, // Below the minimum
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Daily goal must be at least 15 minutes."
    ); // Adjust based on your validation logic
  });

  it("should fail if the dailyGoal is a negative number", async () => {
    const newCategory = {
      habitCategory: {
        name: "NewCategory",
        dailyGoal: -15, // Negative number
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(newCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Daily goal must be at least 15 minutes."
    ); // Adjust based on your validation logic
  });

  it("should fail if invalid fields are sent", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "NewCategory",
        extraField: "SomeValue", // This field is not allowed
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: the following properties are not allowed to be set: extraField"
    );
  });

  it("should fail if the category name contains invalid characters", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "Invalid@Name#", // Invalid name
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
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
        name: "", // Empty name
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain("Category name is required.");
  });

  it("should fail if a category with the same name already exists", async () => {
    const category = {
      habitCategory: {
        name: "NewCategory",
      },
    };

    await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(category);

    const duplicateResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(category);

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.msg).toBe("Category already exists.");
  });

  it("should fail if 'createdAt' is provided as an invalid date", async () => {
    const invalidCategory = {
      habitCategory: {
        name: "InvalidDate",
        createdAt: "InvalidDate", // Invalid date string
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(invalidCategory);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toContain(
      "BAD REQUEST: Invalid 'createdAt' date provided."
    );
  });

  it("should fail if there is no authentication token", async () => {
    const newCategory = {
      habitCategory: {
        name: "NoAuthCategory",
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", "")
      .send(newCategory); // Missing Cookie

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe("BAD REQUEST: Authentication required.");
  });

  it("should fail if a category with the same name (case-sensitive) already exists", async () => {
    const category1 = {
      habitCategory: {
        name: "NewCategory",
      },
    };

    const category2 = {
      habitCategory: {
        name: "newCategory", // Same name, different case
      },
    };

    await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(category1);

    const duplicateResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send(category2);

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.success).toBe(false);
    expect(duplicateResponse.body.msg).toBe("Category already exists.");
  });
});
