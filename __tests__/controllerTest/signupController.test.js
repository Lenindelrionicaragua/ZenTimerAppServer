import supertest from "supertest";
import {
  connectToMockDB,
  closeMockDatabase,
  clearMockDatabase,
} from "../../__testUtils__/dbMock.js";
import app from "../../app.js";
import { addUserToMockDB } from "../../__testUtils__/userMocks.js";

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

describe("signupController", () => {
  test("Should fail if the request body contains an empty user object", async () => {
    const user = {};

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Name, email, password, and date of birth are required."
    );
  });

  test("Should fail if the request body does not contain a user object", async () => {
    const user = null;

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Invalid request: You need to provide a valid 'user' object. Received: null"
    );
  });

  test("Should fail if the request body does not contain a user object", async () => {
    const response = await request.post("/api/auth/sign-up/").send();

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Invalid request: You need to provide a valid 'user' object. Received: undefined"
    );
  });

  test("Should fail if the request does not contain a valid name", async () => {
    const user = {
      name: "Mary!",
      email: "mary@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "BAD REQUEST: Name can only contain letters, numbers, and a single space between words"
    );
  });

  test("Should fail if the request does not contain a name field", async () => {
    const user = {
      email: "mary@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Name, email, password, and date of birth are required."
    );
  });

  test("Should fail if the request does not contain a valid email", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "BAD REQUEST: Email is not in a valid format"
    );
  });

  test("Should fail if the request does not contain a email field", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary.com",
      password: "Password1234!",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Name, email, password, and date of birth are required."
    );
  });

  test("Should fail if the request does not contain a valid password", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      password: "password",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "BAD REQUEST: Password must contain at least one uppercase letter, Password must contain at least one special character"
    );
  });

  test("Should fail if the request does not contain a password field", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Name, email, password, and date of birth are required."
    );
  });

  test("Should fail if the request does not contain a valid password", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      password: "nopass",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "BAD REQUEST: Password must be at least 8 characters long, Password must contain at least one uppercase letter, Password must contain at least one special character"
    );
  });

  test("Should fail if the request does not contain a valid dateOfBirth", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      password: "Password1234!",
      dateOfBirth: "not valid format",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "BAD REQUEST: Date Of Birth is a required field with valid format (MM/DD/YYYY)"
    );
  });

  test("Should fail if the request does not contain a dateOfBirth field", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      password: "Password1234!",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Name, email, password, and date of birth are required."
    );
  });

  test("Should fail if the request contain invalid fields", async () => {
    const user = {
      name: "Mary Jane",
      email: "mary@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
      fakeInvalidField: "invalid content",
    };

    const response = await request.post("/api/auth/sign-up/").send({ user });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe(
      "Invalid request: the following properties are not allowed to be set: fakeInvalidField"
    );
  });

  test("Should fail if the user already exist", async () => {
    const testUser1 = {
      name: "John",
      email: "john@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 1984",
    };

    await addUserToMockDB(testUser1);

    const newUser = {
      name: "John",
      email: "john@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 1984",
    };

    const response = await request
      .post("/api/auth/sign-up/")
      .send({ user: newUser });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.msg).toBe("User already exists");
  });

  test("Should pass if the request contains all required fields and successfully creates a user", async () => {
    const newUser = {
      name: "Ana Laura",
      email: "ana@email.com",
      password: "Password1234!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const response = await request
      .post("/api/auth/sign-up/")
      .send({ user: newUser });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.msg).toBe("User created successfully");
  });
});

// Bug: If the request takes longer than 10 seconds to complete, the request is not canceled. This can lead to performance issues and potential memory leaks due to unresolved promises and timers not being properly cleaned up. Consider revisiting the implementation to ensure that requests are properly canceled after the specified timeout period.
