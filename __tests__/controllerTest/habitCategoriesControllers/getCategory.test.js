import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";

const request = supertest(app);

let testUser;
let cookie;

beforeAll(async () => {
  // Connect to the mock database and create a test user
  await connectToMockDB();

  testUser = {
    name: "Test User",
    email: "testuser@example.com",
    password: "Test1234!",
    dateOfBirth: "Tue Feb 01 1990",
  };

  // Sign up the test user (categories should be created automatically)
  await request.post("/api/auth/sign-up").send({ user: testUser });

  // Log in to get a session cookie for authenticated requests
  const loginResponse = await request
    .post("/api/auth/log-in")
    .send({ user: { email: testUser.email, password: testUser.password } });

  cookie = loginResponse.headers["set-cookie"];
}, 10000);

afterAll(async () => {
  // Clear and close the mock database after tests
  await clearMockDatabase();
  await closeMockDatabase();
});

describe("getCategory", () => {
  it("should return the default categories for the authenticated user", async () => {
    const response = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    // Check that the response is successful
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Ensure that the response contains exactly 6 categories
    expect(response.body).toHaveProperty("categories");
    expect(response.body.categories.length).toBe(6);

    // Check each category's properties
    response.body.categories.forEach((category) => {
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("createdAt");
      expect(category).toHaveProperty("dailyGoal");
    });
  });

  it("should return an empty array if the categories are cleared", async () => {
    // Clear categories for this test case
    await clearMockDatabase();

    const response = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.categories).toEqual([]);
    expect(response.body.msg).toBe(
      "No categories found for this user, but the request was successful."
    );
  });
});
