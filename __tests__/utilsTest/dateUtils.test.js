import { getMonthRange } from "../../util/dateUtils";

describe("getMonthRange", () => {
  test("should return correct date range for a numeric month", () => {
    const { startDate, endDate } = getMonthRange(1, 2024); // January 2024
    expect(startDate).toEqual(new Date(2024, 0, 1)); // January 1, 2024
    expect(endDate).toEqual(new Date(2024, 0, 31)); // January 31, 2024
  });

  test("should return correct date range for a string month", () => {
    const { startDate, endDate } = getMonthRange("February", 2023);
    expect(startDate).toEqual(new Date(2023, 1, 1)); // February 1, 2023
    expect(endDate).toEqual(new Date(2023, 1, 28)); // February 28, 2023 (non-leap year)
  });

  test("should handle leap years correctly for February", () => {
    const { startDate, endDate } = getMonthRange("February", 2024); // Leap year
    expect(startDate).toEqual(new Date(2024, 1, 1)); // February 1, 2024
    expect(endDate).toEqual(new Date(2024, 1, 29)); // February 29, 2024
  });

  test("should throw an error for invalid string month", () => {
    expect(() => getMonthRange("InvalidMonth", 2024)).toThrow(
      "Invalid month name or format provided",
    );
  });

  test("should throw an error for invalid numeric month (e.g., 13)", () => {
    expect(() => getMonthRange(13, 2024)).toThrow(
      "Invalid month number provided",
    );
  });

  test("should throw an error for negative numeric month", () => {
    expect(() => getMonthRange(-1, 2024)).toThrow(
      "Invalid month number provided",
    );
  });

  test("should return correct date range for numeric string month", () => {
    const { startDate, endDate } = getMonthRange("4", 2024); // April 2024
    expect(startDate).toEqual(new Date(2024, 3, 1)); // April 1, 2024
    expect(endDate).toEqual(new Date(2024, 3, 30)); // April 30, 2024
  });
});
