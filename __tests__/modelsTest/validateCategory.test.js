import { validateCategory } from "../../models/habitCategory";
import mongoose from "mongoose";

describe("validateCategory function", () => {
  test("should return an empty array if all required fields are provided correctly", () => {
    const category = {
      name: "Fitness!",
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(),
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

  // Tests for createdBy validation
  test("should return an error if 'createdBy' is not a valid ObjectId", () => {
    const category = {
      name: "Fitness",
      createdBy: "invalidObjectId",
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Invalid 'createdBy' ObjectId.");
  });

  test("should pass if 'createdBy' is a valid ObjectId", () => {
    const category = {
      name: "Fitness",
      createdBy: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });

  // Tests for createdAt validation
  test("should return an error if 'createdAt' is not a valid date", () => {
    const category = {
      name: "Fitness",
      createdBy: new mongoose.Types.ObjectId(),
      createdAt: "invalidDate",
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Invalid 'createdAt' date provided.");
  });

  test("should pass if 'createdAt' is a valid date", () => {
    const category = {
      name: "Fitness",
      createdBy: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });

  // Tests for categoryId validation
  test("should return an error if 'categoryId' is not a valid ObjectId", () => {
    const category = {
      name: "Fitness",
      createdBy: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      categoryId: "invalidObjectId",
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Invalid 'categoryId' provided.");
  });

  test("should pass if 'categoryId' is a valid ObjectId", () => {
    const category = {
      name: "Fitness",
      createdBy: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      categoryId: new mongoose.Types.ObjectId(),
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });
});
