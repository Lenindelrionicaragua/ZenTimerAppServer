import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";

// Mock the autoCreateDefaultCategories function at the beginning
jest.mock("../../util/autoCreateDefaultCategories.js", () => ({
  autoCreateDefaultCategories: jest.fn(),
}));

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

describe("signInWithGoogleController", () => {
  test("Should fail to create default categories if an error occurs during user creation", async () => {
    // Mock the autoCreateDefaultCategories to throw an error for this test
    autoCreateDefaultCategories.mockImplementation(() => {
      throw new Error("Failed to create default categories");
    });

    const response = await request.post("/api/auth/sign-in-with-google").send({
      name: "Test User",
      email: "test@example.com",
      platform: "Web",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "User signed in, but default categories could not be created."
    );
  });
});
