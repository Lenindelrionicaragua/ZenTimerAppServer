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

describe("loginController", () => {
  let testUser;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    await request.post("/api/auth/sign-up").send({ user: testUser });
  });

  // Login test to obtain session cookie
  let cookie;

  test("Should pass if the request contains a valid password and email", async () => {
    const userData = {
      email: "testuser@example.com",
      password: "Test1234!",
    };

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: userData });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.msg).toBe("Login successful");

    // Store the cookie for later use
    cookie = loginResponse.headers["set-cookie"];
  });

  it("should create a new category if it does not exist", async () => {
    const newCategory = {
      habitCategory: {
        name: "New Category!",
        createdBy: testUser.email, // Assuming createdBy is the user's email
        totalMinutes: 120,
        createdAt: new Date(),
      },
    };

    const response = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie) // Set the cookie in the request
      .send(newCategory);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
    expect(response.body.category.createdBy).toEqual(
      newCategory.habitCategory.createdBy
    );
    expect(response.body.category.totalMinutes).toBe(
      newCategory.habitCategory.totalMinutes
    );
  });
});
