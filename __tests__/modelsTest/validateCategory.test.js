import { validateCategory } from "../../models/habitCategory";

describe("validateCategory function", () => {
  test("should return an empty array if all required fields are provided correctly", () => {
    const category = {
      name: "Fitness!",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [
        {
          date: new Date(),
          minutes: 30,
        },
      ],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(0);
  });

  test("should return an array with error messages if required fields are missing", () => {
    const category = {};

    const errors = validateCategory(category);

    expect(errors).toContain("Category name is required.");
    expect(errors).toContain("Creator is required.");
    expect(errors).toContain("Creation date is required.");
  });

  test("should return an error message if the name is null", () => {
    const category = {
      name: null,
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Category name is required.");
  });

  test("should return an error message if the name is an empty string", () => {
    const category = {
      name: "",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Category name is required.");
  });

  test("should return an error message if the name contains invalid characters", () => {
    const category = {
      name: "Invalid@Name",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  test("should return an error message if the name exceeds 15 characters", () => {
    const category = {
      name: "ThisNameIsWayTooLong",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
    );
  });

  test("should return an error message if createdBy is missing", () => {
    const category = {
      name: "Fitness",
      createdAt: new Date(),
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toContain("Creator is required.");
  });

  test("should return an error message if createdAt is missing", () => {
    const category = {
      name: "Fitness",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      dailyRecords: [],
    };

    const errors = validateCategory(category);

    expect(errors).toContain("Creation date is required.");
  });

  test("should return an error if any dailyRecord has negative minutes", () => {
    const category = {
      name: "Fitness",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [{ date: new Date(), minutes: -10 }],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain("Minutes for a daily record cannot be negative.");
  });

  test("should return an error if any dailyRecord has more than 1440 minutes", () => {
    const category = {
      name: "Fitness",
      createdBy: "60c72b2f9b1e8e3d88d23a1e",
      createdAt: new Date(),
      dailyRecords: [{ date: new Date(), minutes: 1500 }],
    };

    const errors = validateCategory(category);

    expect(errors).toHaveLength(1);
    expect(errors).toContain(
      "Minutes for a daily record cannot exceed 1440 minutes (24 hours)."
    );
  });
});
