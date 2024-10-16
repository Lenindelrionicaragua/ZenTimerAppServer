import validateDateRange from "../../util/validateDateRange";

describe("validateDateRange", () => {
  test("Should return null for valid date range", () => {
    const result = validateDateRange("2023-01-01", "2023-12-31");
    expect(result).toBeNull();
  });

  test("Should return an error for invalid startDate", () => {
    const result = validateDateRange("2023-13-01", "2023-12-31");
    expect(result).toBe(
      "BAD REQUEST: startDate must be in a valid ISO format (YYYY-MM-DD)."
    );
  });

  test("Should return an error for invalid endDate", () => {
    const result = validateDateRange("2023-01-01", "2023-02-30");
    expect(result).toBe(
      "BAD REQUEST: endDate must be in a valid ISO format (YYYY-MM-DD)."
    );
  });

  test("Should return multiple errors for both invalid dates", () => {
    const result = validateDateRange("2023-13-01", "2023-02-30");
    expect(result).toBe(
      "BAD REQUEST: startDate must be in a valid ISO format (YYYY-MM-DD)., endDate must be in a valid ISO format (YYYY-MM-DD)."
    );
  });

  test("Should return an error when startDate is greater than endDate", () => {
    const result = validateDateRange("2023-12-31", "2023-01-01");
    expect(result).toBe(
      "BAD REQUEST: startDate cannot be greater than endDate."
    );
  });

  test("Should return an error for invalid date format", () => {
    const result = validateDateRange("invalid-date", "2023-12-31");
    expect(result).toBe(
      "BAD REQUEST: startDate must be in a valid ISO format (YYYY-MM-DD)."
    );
  });
});
