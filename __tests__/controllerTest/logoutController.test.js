import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";

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

describe("logoutController", () => {
  test("Should pass if the session cookie is cleared after logout", async () => {
    const newUser = {
      name: "Marlon torres",
      email: "marlontorres@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const signUpResponse = await request
      .post("/api/auth/sign-up/")
      .send({ user: newUser });

    expect(signUpResponse.status).toBe(201);
    expect(signUpResponse.body.success).toBe(true);
    expect(signUpResponse.body.msg).toBe("User created successfully");

    const logoutResponse = await request.post("/api/auth/log-out/").send();

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toBe("User successfully logged out");

    const cookies = logoutResponse.headers["set-cookie"];
    expect(cookies).toEqual(
      expect.arrayContaining([
        "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      ])
    );
  });
});
