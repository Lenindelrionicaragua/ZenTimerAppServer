import { validateUser } from "../../models/userModels";

describe("validateUser function", () => {
  test("should return an empty array if all required fields are provided", () => {
    const user = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(0);
  });

  test("should return an array with error messages if required fields are missing", () => {
    const user = {};

    const errors = validateUser(user);

    expect(errors).toContain(
      "Name is a required field",
      "Email is a required field",
      "Email is not in a valid format",
      "Password is a required field",
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one special character",
      "Date Of Birth is a required field"
    );
  });

  test("should return an error messages if the name is null", () => {
    const user = {
      name: null,
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual("Name is a required field");
  });

  test("should return an error messages if the name is and empty field", () => {
    const user = {
      name: "",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual("Name is a required field");
  });

  test("should return error messages if the name contains invalid characters or invalid spaces", () => {
    const userSpaceStart = {
      name: " John Carlos",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const userSpaceEnd = {
      name: "John Carlos ",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const userInvalidCharacter = {
      name: "John!",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const userInvalidCharacter2 = {
      name: "John@",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors1 = validateUser(userSpaceStart);
    const errors2 = validateUser(userSpaceEnd);
    const errors3 = validateUser(userInvalidCharacter);
    const errors4 = validateUser(userInvalidCharacter2);

    expect(errors1).toHaveLength(1);
    expect(errors2).toHaveLength(1);
    expect(errors3).toHaveLength(1);
    expect(errors4).toHaveLength(1);

    expect(errors1).toContainEqual(
      "Name can only contain letters, numbers, and a single space between words"
    );
    expect(errors2).toContainEqual(
      "Name can only contain letters, numbers, and a single space between words"
    );
    expect(errors3).toContainEqual(
      "Name can only contain letters, numbers, and a single space between words"
    );
    expect(errors4).toContainEqual(
      "Name can only contain letters, numbers, and a single space between words"
    );
  });

  test("should return an error messages if the email is null", () => {
    const user = {
      name: "Anne",
      email: null,
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual("Email is a required field");
    expect(errors).toContainEqual("Email is not in a valid format");
  });

  test("should return an error messages if the email is and empty string", () => {
    const user = {
      name: "Anne",
      email: "",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(2);
    expect(errors).toContainEqual("Email is a required field");
    expect(errors).toContainEqual("Email is not in a valid format");
  });

  test("should return error messages if the email is not in a valid format", () => {
    const emailSpaceStart = {
      name: "John Carlos",
      email: " john@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const emailSpaceEnd = {
      name: "John Carlos",
      email: "john@example.com ",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const emailInvalidFormat1 = {
      name: "John Carlos",
      email: "johnexample.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const emailInvalidFormat2 = {
      name: "John Carlos",
      email: "john@example",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const emailInvalidFormat3 = {
      name: "John Carlos",
      email: "john!*@example.com",
      password: "Password123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors1 = validateUser(emailSpaceStart);
    const errors2 = validateUser(emailSpaceEnd);
    const errors3 = validateUser(emailInvalidFormat1);
    const errors4 = validateUser(emailInvalidFormat2);
    const errors5 = validateUser(emailInvalidFormat3);

    expect(errors1).toHaveLength(1);
    expect(errors2).toHaveLength(1);
    expect(errors3).toHaveLength(1);
    expect(errors4).toHaveLength(1);
    expect(errors5).toHaveLength(1);

    expect(errors1).toContainEqual("Email is not in a valid format");
    expect(errors2).toContainEqual("Email is not in a valid format");
    expect(errors3).toContainEqual("Email is not in a valid format");
    expect(errors4).toContainEqual("Email is not in a valid format");
    expect(errors5).toContainEqual("Email is not in a valid format");
  });

  test("should return an error messages if the password is null, an empty string or does not have at least 8 characters long", () => {
    const passwordNull = {
      name: "Anne",
      email: "anne@example.com",
      password: null,
      dateOfBirth: "Tue Feb 01 2022",
    };

    const passwordEmpty = {
      name: "Anne",
      email: "anne@example.com",
      password: "",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const passwordToShort = {
      name: "Anne",
      email: "anne@example.com",
      password: "A12345!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors1 = validateUser(passwordNull);
    const errors2 = validateUser(passwordEmpty);
    const errors3 = validateUser(passwordToShort);

    expect(errors1).toHaveLength(4);
    expect(errors2).toHaveLength(4);
    expect(errors3).toHaveLength(1);

    expect(errors1).toContainEqual(
      "Password is a required field",
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one special character"
    );
    expect(errors2).toContainEqual(
      "Password is a required field",
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter",
      "Password must contain at least one special character"
    );
    expect(errors3).toContainEqual(
      "Password must be at least 8 characters long"
    );
  });

  test("Should return an error message if the password is not at least 8 characters long", () => {
    const user = {
      name: "Anne",
      email: "john@example.com",
      password: "A123!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual(
      "Password must be at least 8 characters long"
    );
  });

  test("Should return an error message if the password does not contain at least one uppercase letter", () => {
    const user = {
      name: "Anne",
      email: "john@example.com",
      password: "12345678!",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual(
      "Password must contain at least one uppercase letter"
    );
  });

  test("Should return an error message if the password does not contain at least one special character", () => {
    const user = {
      name: "Anne",
      email: "john@example.com",
      password: "A12345678",
      dateOfBirth: "Tue Feb 01 2022",
    };

    const errors = validateUser(user);

    expect(errors).toHaveLength(1);
    expect(errors).toContainEqual(
      "Password must contain at least one special character"
    );
  });

  test("should return an error messages if the password is null or an empty string", () => {
    const dateOfBirthNull = {
      name: "Anne",
      email: "anne@example.com",
      password: "A12345678!",
      dateOfBirth: null,
    };

    const dateOfBirthEmpty = {
      name: "Anne",
      email: "anne@example.com",
      password: "A12345678!",
      dateOfBirth: "",
    };

    const errors1 = validateUser(dateOfBirthNull);
    const errors2 = validateUser(dateOfBirthEmpty);

    expect(errors1).toHaveLength(2);
    expect(errors2).toHaveLength(2);

    expect(errors1).toContainEqual(
      "Date Of Birth is a required field",
      "Date Of Birth is a required field with valid format (MM/DD/YYYY)"
    );
    expect(errors2).toContainEqual(
      "Date Of Birth is a required field",
      "Date Of Birth is a required field with valid format (MM/DD/YYYY)"
    );
  });
});
