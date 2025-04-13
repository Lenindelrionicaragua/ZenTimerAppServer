import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";

const request = supertest(app);

const defaultCategoryNames = [
  "Work",
  "Family time",
  "Exercise",
  "Screen-free",
  "Rest",
  "Study",
];

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Auto-create default categories", () => {
  let testUser;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // User sign-up
    await request.post("/api/auth/sign-up").send({ user: testUser });
  });

  it("should create default categories when a user signs up", async () => {
    const response = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    const cookie = response.headers["set-cookie"];

    // Verify that categories were created
    const categoriesResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    expect(categoriesResponse.status).toBe(200);
    expect(categoriesResponse.body.success).toBe(true);
    expect(categoriesResponse.body.categories.length).toBe(6);

    defaultCategoryNames.forEach((name) => {
      expect(
        categoriesResponse.body.categories.some((cat) => cat.name === name),
      ).toBe(true);
    });
  });

  it("should not create duplicate default categories", async () => {
    const response = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    const cookie = response.headers["set-cookie"];

    // Attempt to create the default categories again
    await autoCreateDefaultCategories(testUser._id); // Call the function directly if needed

    // Verify categories again
    const categoriesResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    const categories = categoriesResponse.body.categories;

    expect(categories.length).toBe(6); // Still 6 categories
    const categoryCountMap = categories.reduce((acc, cat) => {
      acc[cat.name] = (acc[cat.name] || 0) + 1;
      return acc;
    }, {});

    defaultCategoryNames.forEach((name) => {
      expect(categoryCountMap[name]).toBe(1); // Each category should only exist once
    });
  });

  it("should skip creating categories that already exist", async () => {
    const response = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    const cookie = response.headers["set-cookie"];

    await autoCreateDefaultCategories(testUser._id); // First call

    // Attempt to create categories again
    await autoCreateDefaultCategories(testUser._id); // Second call

    const categoriesResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    const categories = categoriesResponse.body.categories;

    expect(categories.length).toBe(6);

    // Verify the number of categories remains unchanged
    defaultCategoryNames.forEach((name) => {
      expect(categories.some((cat) => cat.name === name)).toBe(true);
    });
  });

  it("should fail to create a 7th category and ensure the total remains 6", async () => {
    const response = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    const cookie = response.headers["set-cookie"];

    await autoCreateDefaultCategories(testUser._id);

    let categoriesResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    let categories = categoriesResponse.body.categories;
    expect(categories.length).toBe(6);

    const createResponse = await request
      .post("/api/habit-categories/create")
      .set("Cookie", cookie)
      .send({ habitCategory: { name: "Projects" } });

    expect(createResponse.status).toBe(400);

    categoriesResponse = await request
      .get("/api/habit-categories")
      .set("Cookie", cookie);

    categories = categoriesResponse.body.categories;

    expect(categories.length).toBe(6);
  });
});
