import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../../__testUtils__/dbMock.js";
import app from "../../../app.js";
import HabitCategory from "../../../models/habitCategory.js";

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

describe("deleteAllCategories Endpoint Tests", () => {
  let testUser;
  let cookie;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // Sign up a new user
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // Log in the user
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];
  });

  it("should create 6 default categories on user sign-up", async () => {
    // Verify that 6 categories were created for the user
    const categories = await HabitCategory.find({});
    expect(categories.length).toBe(6);
  });

  it("should delete all categories for the user using deleteAllCategories", async () => {
    // Verify that the user has 6 default categories before deletion
    let initialCategories = await HabitCategory.find({});
    expect(initialCategories.length).toBe(6);

    // Send delete request to remove all categories
    const deleteResponse = await request
      .delete("/api/habit-categories/delete-all-categories")
      .set("Cookie", cookie);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(deleteResponse.body.msg).toBe(
      "All categories and their associated records have been deleted."
    );

    // Verify that all categories have been deleted
    const remainingCategories = await HabitCategory.find({});
    expect(remainingCategories.length).toBe(0);
  });
});
