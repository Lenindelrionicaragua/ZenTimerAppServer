import { validateDailyRecords } from "../../models/dailyRecords";
import mongoose from "mongoose";

describe("validateDailyRecords", () => {
  // Category: Required Fields Validation
  describe("Required Fields Validation", () => {
    test("should return an empty array if all required fields are provided correctly", () => {
      const dailyRecord = {
        categoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        date: "2024-10-12",
        minutesUpdate: 30,
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });

    test("should return an error if required fields are missing", () => {
      const dailyRecord = {};

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("minutesUpdate is required.");
    });
  });

  // Category: minutesUpdate Validation
  describe("minutesUpdate Validation", () => {
    test("should return an error if minutesUpdate is null", () => {
      const dailyRecord = { minutesUpdate: null, date: new Date() };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("minutesUpdate is required.");
    });

    test("should return an error if minutesUpdate is an empty string", () => {
      const dailyRecord = { minutesUpdate: "" };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("minutesUpdate must be a number.");
    });

    test("should return an error if minutesUpdate is negative", () => {
      const dailyRecord = { minutesUpdate: -3 };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain(
        "minutesUpdate must be between 0 and 1440 (24 hours in minutes)."
      );
    });

    test("should return an error if minutesUpdate is over 1440 minutes", () => {
      const dailyRecord = { minutesUpdate: 1600 };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain(
        "minutesUpdate must be between 0 and 1440 (24 hours in minutes)."
      );
    });

    test("should return an error if minutesUpdate contains invalid characters", () => {
      const dailyRecord = { minutesUpdate: "1600!" };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("minutesUpdate must be a number.");
    });

    test("should return an error if minutesUpdate contains letters", () => {
      const dailyRecord = { minutesUpdate: "abc1" };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("minutesUpdate must be a number.");
    });

    test("should pass if minutesUpdate is exactly 0", () => {
      const dailyRecord = {
        minutesUpdate: 0,
        categoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });

    test("should pass if minutesUpdate is exactly 1440", () => {
      const dailyRecord = {
        minutesUpdate: 1440,
        categoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });
  });

  // Category: categoryId Validation
  describe("categoryId Validation", () => {
    test("should return an error if categoryId is not a valid ObjectId", () => {
      const dailyRecord = { minutesUpdate: 30, categoryId: "invalidObjectId" };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("categoryId must be a valid ObjectId.");
    });

    test("should pass if categoryId is a valid ObjectId", () => {
      const dailyRecord = {
        minutesUpdate: 30,
        categoryId: new mongoose.Types.ObjectId(),
      };
      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });
  });

  // Category: userId Validation
  describe("userId Validation", () => {
    test("should return an error if userId is not a valid ObjectId", () => {
      const dailyRecord = { minutesUpdate: 30, userId: "invalidObjectId" };
      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("userId must be a valid ObjectId.");
    });

    test("should pass if userId is a valid ObjectId", () => {
      const dailyRecord = {
        minutesUpdate: 30,
        userId: new mongoose.Types.ObjectId(),
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });
  });

  // Category: date Validation
  describe("date Validation", () => {
    test("should return an error if date is not a valid date", () => {
      const dailyRecord = {
        minutesUpdate: 45,
        userId: new mongoose.Types.ObjectId(),
        date: "invalidDate",
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain("Invalid date format.");
    });

    test("should pass if date is a valid date", () => {
      const dailyRecord = {
        minutesUpdate: 45,
        userId: new mongoose.Types.ObjectId(),
        date: new Date(),
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });

    test("should pass if date is not provided (optional field)", () => {
      const dailyRecord = {
        minutesUpdate: 45,
        userId: new mongoose.Types.ObjectId(),
        categoryId: new mongoose.Types.ObjectId(),
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toHaveLength(0);
    });
  });

  // Category: Additional Fields Validation
  describe("Additional Fields Validation", () => {
    test("should return an error if there are additional unallowed fields", () => {
      const dailyRecord = {
        minutesUpdate: 30,
        categoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        extraField: "not allowed",
      };

      const errors = validateDailyRecords(dailyRecord);

      expect(errors).toContain(
        "the following properties are not allowed to be set: extraField"
      );
    });
  });
});
