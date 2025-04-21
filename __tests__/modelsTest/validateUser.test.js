import { validateUser } from "../../models/userModels";

describe("validateUser function", () => {
  test("should return an empty array if all required fields are provided", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);
    expect(errors).toHaveLength(0);
  });

  test("should return an array with error messages if required fields are missing", () => {
    const user = {};
    const errors = validateUser(user);

    expect(errors).toEqual(
      expect.arrayContaining([
        "Name is a required field.",
        "Email is a required field",
        "Password is a required field",
        "Date Of Birth is a required field.",
      ]),
    );
  });

  test("should return an error message if the name is null", () => {
    const user = {
      name: null,
      email: "john@example.com",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);

    expect(errors).toContain("Name is a required field.");
  });

  test("should return an error message if the name is an empty field", () => {
    const user = {
      name: "",
      email: "john@example.com",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);
    expect(errors).toContain("Name is a required field.");
  });

  test("should return error messages if the name contains invalid characters or spaces", () => {
    const user = {
      name: "John   Doe ",
      email: "john@example.com",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);

    expect(errors).toEqual(
      expect.arrayContaining([
        "Name cannot have multiple spaces or spaces at the ends.",
      ]),
    );
  });

  test("should return error messages if the email is null", () => {
    const user = {
      name: "John Doe",
      email: null,
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);

    expect(errors).toEqual(
      expect.arrayContaining(["Email is a required field"]),
    );
  });

  test("should return error messages if the email is an empty string", () => {
    const user = {
      name: "John Doe",
      email: "",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);
    expect(errors).toEqual(
      expect.arrayContaining(["Email is a required field"]),
    );
  });

  test("should return an error message if the email is not in a valid format", () => {
    const user = {
      name: "John Doe",
      email: "invalid-email",
      password: "Password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);
    expect(errors).toContain("Email is not in a valid format");
  });

  test("should return error messages if the password is invalid or missing", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);

    expect(errors).toEqual(
      expect.arrayContaining(["Password is a required field"]),
    );
  });

  test("should return an error message if the password lacks an uppercase letter", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "password1!",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);
    expect(errors).toContain(
      "Password must contain at least one uppercase letter",
    );
  });

  test("should return an error message if the password lacks a special character", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password123",
      dateOfBirth: "Tue Feb 01 2022",
    };
    const errors = validateUser(user);
    expect(errors).toContain(
      "Password must contain at least one special character.",
    );
  });

  test("should return error messages if the dateOfBirth is null or empty", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "A12345678!",
      dateOfBirth: "",
    };
    const errors = validateUser(user);
    expect(errors).toEqual(
      expect.arrayContaining(["Date Of Birth is a required field."]),
    );
  });

  test("should return an error if dateOfBirth has an invalid format", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "A12345678!",
      dateOfBirth: "2022-01-01", // incorrect format
    };
    const errors = validateUser(user);
    expect(errors).toContain(
      "Date Of Birth must be in valid format (e.g., 'Tue Feb 01 2022').",
    );
  });
});
