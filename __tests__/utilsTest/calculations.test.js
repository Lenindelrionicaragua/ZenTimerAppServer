import {
  calculateTotalMinutes,
  calculateCategoryPercentages,
} from "../../util/calculations";

// Test data
const categoryStatsMock = [
  { name: "Work", totalMinutes: 120 },
  { name: "Exercise", totalMinutes: 60 },
  { name: "Study", totalMinutes: 180 },
];

const singleCategoryMock = [{ name: "Work", totalMinutes: 120 }];

describe("calculateTotalMinutes", () => {
  it("should correctly calculate total minutes for multiple categories", () => {
    const totalMinutes = calculateTotalMinutes(categoryStatsMock);
    expect(totalMinutes).toBe(360); // 120 + 60 + 180 = 360
  });

  it("should return the correct total for a single category", () => {
    const totalMinutes = calculateTotalMinutes(singleCategoryMock);
    expect(totalMinutes).toBe(120); // Just the one category
  });

  it("should return 0 if no categories are provided", () => {
    const totalMinutes = calculateTotalMinutes([]);
    expect(totalMinutes).toBe(0);
  });
});

describe("calculatePercentages", () => {
  it("should correctly calculate percentages for multiple categories", () => {
    const totalMinutes = 360; // Mocked total minutes for this test
    const percentages = calculateCategoryPercentages(
      categoryStatsMock,
      totalMinutes
    );

    // The expected percentages:
    // Work: (120 / 360) * 100 = 33.33
    // Exercise: (60 / 360) * 100 = 16.67
    // Study: (180 / 360) * 100 = 50.00
    expect(percentages[0].percentage).toBe("33.33");
    expect(percentages[1].percentage).toBe("16.67");
    expect(percentages[2].percentage).toBe("50.00");
  });

  it("should handle single category percentages correctly", () => {
    const totalMinutes = 120; // Total minutes for one category
    const percentages = calculateCategoryPercentages(
      singleCategoryMock,
      totalMinutes
    );

    // Since there's only one category, its percentage should be 100%
    expect(percentages[0].percentage).toBe("100.00");
  });

  it("should return 0% if totalMinutes is 0", () => {
    const totalMinutes = 0; // No minutes tracked
    const percentages = calculateCategoryPercentages(
      categoryStatsMock,
      totalMinutes
    );

    // All percentages should be 0
    percentages.forEach((category) => {
      expect(category.percentage).toBe(0);
    });
  });
});
