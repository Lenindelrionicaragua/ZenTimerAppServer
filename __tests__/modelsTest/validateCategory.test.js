import { validateCategory } from "../../models/habitCategory";

describe("validateCategory function", () => {
  test("should return an empty array if all required fields are provided correctly", () => {
    const category = {
      name: "Fitness!",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });

  test("should return an array with error messages if required fields are missing", () => {
    const category = {};

    const errors = validateCategory(category);

    expect(errors).toContain("Category name is required.");
  });

  test("should return an error message if the name is null", () => {
    const category = {
      name: null,
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Category name is required.");
  });

  test("should return an error message if the name is an empty string", () => {
    const category = {
      name: "",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Category name is required.");
  });

  test("should return an error message if the name contains invalid characters", () => {
    const category = {
      name: "Fit@ness",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain(
      "Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  test("should return an error message if the name exceeds 15 characters", () => {
    const category = {
      name: "ThisNameIsWayTooLong",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain(
      "Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  test("should allow numbers in the category name", () => {
    const category = {
      name: "Fitness123",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });

  test("should allow a name with exactly 15 characters", () => {
    const category = {
      name: "ValidCategory15",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });
});
