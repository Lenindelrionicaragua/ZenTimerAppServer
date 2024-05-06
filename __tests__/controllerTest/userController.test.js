import supertest from "supertest";
import app from "../../app.js";
import User from "../../models/userModels.js";

import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";

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

describe("getUsers Controller", () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  test("Should return list of users when getUsers is successful", async () => {
    const users = [
      {
        name: "User 1",
        email: "user1@example.com",
        password: "Password1!",
        dateOfBirth: "Tue Feb 01 2022",
      },
      {
        name: "User 2",
        email: "user2@example.com",
        password: "Password2!",
        dateOfBirth: "Tue Feb 01 2022",
      },
    ];

    await Promise.all(
      users.map(async (user) => {
        await request.post("/api/auth/sign-up").send({ user });
      })
    );

    const loginUser = {
      email: "user1@example.com",
      password: "Password1!",
    };

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: loginUser });
    expect(loginResponse.status).toBe(200);

    const sessionCookie = loginResponse.headers["set-cookie"][0];

    const response = await request
      .get("/api/user/")
      .set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.result).toBeInstanceOf(Array);
    expect(response.body.result.length).toBe(2);
  });

  // test("Should return 403 if session cookie is not provided", async () => {
  //   const response = await request.get("/api/user/");
  //   expect(response.status).toBe(403);
  //   expect(response.body.error).toBe("Session cookie not found.");
  // });

  test("Should return 403 if session token does not match", async () => {
    const users = [
      {
        name: "User 1",
        email: "user1@example.com",
        password: "Password1!",
        dateOfBirth: "Tue Feb 01 2022",
      },
      {
        name: "User 2",
        email: "user2@example.com",
        password: "Password2!",
        dateOfBirth: "Tue Feb 01 2022",
      },
    ];

    await Promise.all(
      users.map(async (user) => {
        await request.post("/api/auth/sign-up").send({ user });
      })
    );

    const loginUser = {
      email: "user1@example.com",
      password: "Password1!",
    };

    const loginResponse = await request
      .post("/api/auth/log-in")
      .send({ user: loginUser });
    expect(loginResponse.status).toBe(200);

    const validSessionCookie = loginResponse.headers["set-cookie"][0];

    const modifiedSessionCookie = validSessionCookie.replace(
      /session=[^;]*/,
      "session=invalid_session_token"
    );

    const response = await request
      .get("/api/user/")
      .set("Cookie", modifiedSessionCookie);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      "Error verifying token in session cookie:"
    );
  });
});
