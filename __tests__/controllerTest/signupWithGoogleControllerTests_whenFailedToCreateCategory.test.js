import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";
import { sendWelcomeEmail } from "../../controllers/authControllers/emailWelcomeController.js";
import { OAuth2Client } from "google-auth-library"; // Import the OAuth2Client

jest.mock(
  "../../controllers/authControllers/emailWelcomeController.js",
  () => ({
    sendWelcomeEmail: jest.fn(),
  }),
);

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

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    const response = await request.post("/api/auth/sign-in-with-google").send({
      name: "John Doe",
      email: "john@example.com",
      picture: "http://example.com/john.jpg",
      platform: "Web",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "User signed in, but default categories could not be created.",
    );
  });

  test("Should fail to create default categories if an error occurs during user creation in mobile platform", async () => {
    // Mock the autoCreateDefaultCategories to throw an error for this test
    autoCreateDefaultCategories.mockImplementation(() => {
      throw new Error("Failed to create default categories");
    });

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    // Mock the behavior of verifying the token
    const mockToken = "mockGoogleIdToken";
    const mockPayload = {
      name: "John Doe",
      email: "john@example.com",
      picture: "http://example.com/john.jpg",
    };

    // Simulate the token verification process
    jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => mockPayload,
    });

    const response = await request.post("/api/auth/sign-in-with-google").send({
      token: mockToken, // Provide the mock token here
      platform: "Android",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "User signed in, but default categories could not be created. In mobile Platform.",
    );
  });
});
