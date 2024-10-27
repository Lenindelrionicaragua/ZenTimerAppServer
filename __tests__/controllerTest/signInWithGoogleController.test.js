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

const request = supertest(app);

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
  test("Should sign in successfully and create a new user for the Web platform", async () => {
    const response = await request.post("/api/auth/sign-in-with-google").send({
      name: "John Doe",
      email: "john@example.com",
      picture: "http://example.com/john.jpg",
      platform: "Web",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User signed in successfully");
    expect(response.body.token).toBeDefined();

    const user = await User.findOne({ email: "john@example.com" });
    expect(user).toBeDefined();

    const categories = await HabitCategory.find({ userId: user._id });
    expect(categories).toHaveLength(6);
  });

  test("Should fail if the platform is invalid", async () => {
    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ token: "dummyToken", platform: "InvalidPlatform" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid platform");
  });

  test("Should fail if the token is missing for mobile platforms", async () => {
    const response = await request
      .post("/api/auth/sign-in-with-google")
      .send({ platform: "iOS" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("idToken from Google is missing.");
  });
});
