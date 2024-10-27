import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { addUserToMockDB } from "../../__testUtils__/userMocks.js";

// Mock the autoCreateDefaultCategories function at the beginning
jest.mock("../../util/autoCreateDefaultCategories.js", () => ({
  autoCreateDefaultCategories: jest.fn(),
}));

import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";

const request = supertest(app);

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
  jest.clearAllMocks();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("Signup with Category Creation Failure", () => {
  test("Should create user and fail to create default categories", async () => {
    const newUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    // Mock the autoCreateDefaultCategories to throw an error for this test
    autoCreateDefaultCategories.mockImplementation(() => {
      throw new Error("Failed to create default categories");
    });

    const response = await request
      .post("/api/auth/sign-up/")
      .send({ user: newUser });

    expect(response.status).toBe(201); // User created successfully
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toContain(
      "User created successfully, but there was an issue creating default categories"
    );
    expect(response.body.user).toHaveProperty("_id"); // Check user object has an ID
  });
});
