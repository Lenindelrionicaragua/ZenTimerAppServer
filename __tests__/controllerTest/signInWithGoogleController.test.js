import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import User from "../../models/userModels.js";
import HabitCategory from "../../models/habitCategory.js";
import { addUserToMockDB } from "../../__testUtils__/userMocks.js";
import { OAuth2Client } from "google-auth-library";
import { logInfo } from "../../util/logging.js";
import { sendWelcomeEmail } from "../../controllers/authControllers/emailWelcomeController.js";

const request = supertest(app);

jest.mock(
  "../../controllers/authControllers/emailWelcomeController.js",
  () => ({
    sendWelcomeEmail: jest.fn(),
  })
);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID_WEB);

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
  // Test for Web platform
  test("Should sign in successfully and create a new user for the Web platform", async () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      picture: "http://example.com/john.jpg",
      platform: "Web",
    };

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send(userData);

    const responseData = response.body;
    logInfo(`SignIn response: ${JSON.stringify(responseData)}`);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("User signed in successfully");
    expect(response.body.token).toBeDefined();
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.picture).toBe(userData.picture);

    const user = await User.findOne({ email: "john@example.com" });
    expect(user).toBeDefined();

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });

  // Test for invalid platform
  test("Should fail if the platform is invalid", async () => {
    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ token: "dummyToken", platform: "InvalidPlatform" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid platform: InvalidPlatform");
  });

  // Test for missing token on mobile platforms
  test("Should fail if the token is missing for mobile platforms", async () => {
    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ platform: "iOS" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("idToken from Google is missing.");
  });

  // Test creating a new user if they do not exist
  test("Should create a new user if user does not exist in the database", async () => {
    const nonExistentEmail = "newuser@example.com";
    let user = await User.findOne({ email: nonExistentEmail });
    expect(user).toBeNull(); // Ensure no user exists with this email.

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    const response = await request.post("/api/auth/sign-in-with-google").send({
      name: "New User",
      email: nonExistentEmail,
      picture: "http://example.com/newuser.jpg",
      platform: "Web",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("User signed in successfully");
    expect(response.body.token).toBeDefined();
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

    user = await User.findOne({ email: nonExistentEmail });
    expect(user).toBeDefined();
    expect(user.name).toBe("New User");
    expect(user.email).toBe(nonExistentEmail);

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });

  // New test: Should sign in successfully and create a new user for Android platform
  test("Should sign in successfully and create a new user for the Android platform", async () => {
    const userData = {
      name: "Jane Doe",
      email: "jane@example.com",
      picture: "http://example.com/jane.jpg",
      platform: "Android",
      token: "mockGoogleIdToken", // Mock token for the test
    };

    // Mock the behavior of verifying the token
    const mockPayload = {
      name: "Jane Doe",
      email: "jane@example.com",
      picture: "http://example.com/jane.jpg",
    };

    // Simulate the token verification process
    jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => mockPayload,
    });

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "User created and signed in successfully. In mobil platform."
    );
    expect(response.body.token).toBeDefined();
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.picture).toBe(userData.picture);

    const user = await User.findOne({ email: "jane@example.com" });
    expect(user).toBeDefined();

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });

  // New test: Should sign in successfully and create a new user for iOS platform
  test("Should sign in successfully and create a new user for the iOS platform", async () => {
    const userData = {
      name: "Alice Smith",
      email: "alice@example.com",
      picture: "http://example.com/alice.jpg",
      platform: "iOS",
      token: "mockGoogleIdToken", // Mock token for the test
    };

    // Mock the behavior of verifying the token
    const mockPayload = {
      name: "Alice Smith",
      email: "alice@example.com",
      picture: "http://example.com/alice.jpg",
    };

    // Simulate the token verification process
    jest.spyOn(OAuth2Client.prototype, "verifyIdToken").mockResolvedValue({
      getPayload: () => mockPayload,
    });

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe(
      "User created and signed in successfully. In mobil platform."
    );
    expect(response.body.token).toBeDefined();
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.picture).toBe(userData.picture);

    const user = await User.findOne({ email: "alice@example.com" });
    expect(user).toBeDefined();

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });
});
