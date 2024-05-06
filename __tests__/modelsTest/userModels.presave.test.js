import User from "../../models/userModels";

describe("User Model Middleware", () => {
  test("should fail if the request is missing the password field", async () => {
    const user = new User({
      name: "John Doe",
      email: "john@example.com",
      password: "",
      dateOfBirth: "1990-01-01",
    });

    try {
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("user validation failed");
      expect(error.errors).toHaveProperty("password");
      expect(error.errors.password.kind).toBe("required");
      return;
    }

    throw new Error(
      "Expected the user save operation to fail, but it succeeded."
    );
  });

  test("should fail if the request is missing the name fields", async () => {
    const user = new User({
      name: "",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "1990-01-01",
    });

    try {
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("user validation failed");
      expect(error.errors).toHaveProperty("name");
      expect(error.errors.name.kind).toBe("required");
      return;
    }

    throw new Error(
      "Expected the user save operation to fail, but it succeeded."
    );
  });

  test("should fail if the request is missing the email fields", async () => {
    const user = new User({
      name: "Ana Laura",
      email: null,
      password: "Password123!",
      dateOfBirth: "1990-01-01",
    });

    try {
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("user validation failed");
      expect(error.errors).toHaveProperty("email");
      expect(error.errors.email.kind).toBe("required");
      return;
    }

    throw new Error(
      "Expected the user save operation to fail, but it succeeded."
    );
  });

  test("should fail if the request is missing the dateOfBirth fields", async () => {
    const user = new User({
      name: "Ana Laura",
      email: "analaura@gmail.com",
      password: "Password123!",
      dateOfBirth: "",
    });

    try {
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("user validation failed");
      expect(error.errors).toHaveProperty("dateOfBirth");
      expect(error.errors.dateOfBirth.kind).toBe("required");
      return;
    }

    throw new Error(
      "Expected the user save operation to fail, but it succeeded."
    );
  });

  test("should fail if the request is not an object", async () => {
    const user = new User(null);

    try {
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toContain("user validation failed");
      expect(error.errors).toBeDefined();
      expect(Object.keys(error.errors).length).toBe(4);
      Object.values(error.errors).forEach((validationError) => {
        expect(validationError).toHaveProperty(
          "message",
          `Path \`${validationError.path}\` is required.`
        );
      });
      return;
    }

    throw new Error(
      "Expected the user save operation to fail, but it succeeded."
    );
  });

  it("should save the user without errors", async () => {
    User.prototype.save = jest.fn().mockResolvedValueOnce();

    const userData = {
      name: "John Doe",
      email: "john@example.com",
      password: "Password123!",
      dateOfBirth: "1990-01-01",
    };

    try {
      const user = new User(userData);
      await user.save();
      expect(User.prototype.save).toHaveBeenCalledTimes(1);
    } catch (error) {
      expect(error).toBeUndefined();
      throw new Error(
        "Expected the user save operation to succeed, but it failed with an error."
      );
    }
  });
});
