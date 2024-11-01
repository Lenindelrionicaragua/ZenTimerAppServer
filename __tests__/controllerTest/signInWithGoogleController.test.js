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

  // New test cases for mobile platforms
  test("Should sign in successfully and create a new user for the iOS platform", async () => {
    const token = "dummyIosToken"; // This should be a valid token for a real test
    const userData = {
      name: "Jane Smith",
      email: "jane@example.com",
      picture: "http://example.com/jane.jpg",
      platform: "iOS",
    };

    sendWelcomeEmail.mockResolvedValue(true); // Simulate successful email sending

    // Mock the OAuth2Client's verifyIdToken method to return the expected payload
    googleClient.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => userData,
    });

    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ token, platform: "iOS" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("User created and signed in successfully");
    expect(response.body.token).toBeDefined();
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);

    const user = await User.findOne({ email: userData.email });
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.picture).toBe(userData.picture);

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });

  test("Should sign in successfully if user already exists for the Android platform", async () => {
    const existingEmail = "existinguser@example.com";
    const existingUser = new User({
      name: "Existing User",
      email: existingEmail,
      picture: "http://example.com/existinguser.jpg",
    });
    await existingUser.save();

    const token = "dummyAndroidToken"; // This should be a valid token for a real test

    // Mock the OAuth2Client's verifyIdToken method to return the existing user's data
    googleClient.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        name: existingUser.name,
        email: existingUser.email,
        picture: existingUser.picture,
      }),
    });

    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ token, platform: "Android" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("User signed in successfully");
    expect(response.body.token).toBeDefined();

    const user = await User.findOne({ email: existingEmail });
    expect(user).toBeDefined();
    expect(user.name).toBe(existingUser.name);
    expect(user.email).toBe(existingEmail);
  });
});
