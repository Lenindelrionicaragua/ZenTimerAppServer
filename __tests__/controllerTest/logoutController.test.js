import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { sendVerificationEmail } from "../../controllers/authControllers/emailVerificationController.js";

const request = supertest(app);

jest.mock(
  "../../controllers/authControllers/emailVerificationController.js",
  () => ({
    sendVerificationEmail: jest.fn(),
    resendVerificationLink: jest.fn(),
    verifyEmail: jest.fn(),
  })
);

beforeAll(async () => {
  await connectToMockDB();
});

afterEach(async () => {
  await clearMockDatabase();
});

afterAll(async () => {
  await closeMockDatabase();
});

describe("logoutController", () => {
  let testUser;
  let cookie;

  beforeEach(async () => {
    testUser = {
      name: "Test User",
      email: "testuser@example.com",
      password: "Test1234!",
      dateOfBirth: "Tue Feb 01 1990",
    };

    sendVerificationEmail.mockResolvedValue(true);

    // User sign-up
    await request.post("/api/auth/sign-up").send({ user: testUser });

    // User login
    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: { email: testUser.email, password: testUser.password } });

    cookie = loginResponse.headers["set-cookie"];
  });

  test("Should pass if the session cookie is cleared after logout", async () => {
    const logoutResponse = await request
      .post("/api/user/log-out")
      .set("Cookie", cookie);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toBe("User successfully logged out");

    // Check that the session cookie is cleared correctly
    const cookies = logoutResponse.headers["set-cookie"];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        ),
        expect.stringContaining(
          "zenTimerToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
        ), // If you have additional cookies
      ])
    );
  });
});
