// Import the function to be tested
import { addPercentagePerDayToRecords } from "../../util/dataTransformations";

describe("addPercentagePerDayToRecords", () => {
  it("should calculate dailyPercentage correctly when totalDailyMinutes are provided", () => {
    // Sample input records
    const records = [
      { date: "2024-02-05T00:00:00.000Z", totalDailyMinutes: 45 },
      { date: "2024-02-15T00:00:00.000Z", totalDailyMinutes: 30 },
      { date: "2024-02-15T00:00:00.000Z", totalDailyMinutes: 60 },
    ];

    // Total daily minutes for each date
    const totalDailyMinutes = {
      "2024-02-05": 135,
      "2024-02-15": 150,
    };

    // Expected output after calculation
    const expectedOutput = [
      {
        date: "2024-02-05T00:00:00.000Z",
        totalDailyMinutes: 45,
        dailyPercentage: "33.33",
      },
      {
        date: "2024-02-15T00:00:00.000Z",
        totalDailyMinutes: 30,
        dailyPercentage: "20.00",
      },
      {
        date: "2024-02-15T00:00:00.000Z",
        totalDailyMinutes: 60,
        dailyPercentage: "40.00",
      },
    ];

    // Run the function and compare the result to the expected output
    const result = addPercentagePerDayToRecords(records, totalDailyMinutes);
    expect(result).toEqual(expectedOutput);
  });

  it("should return null percentage if totalDailyMinutes for the date is not found", () => {
    // Sample input records
    const records = [
      { date: "2024-02-10T00:00:00.000Z", totalDailyMinutes: 50 },
    ];

    // Total daily minutes for each date (note 2024-02-10 is missing)
    const totalDailyMinutes = {
      "2024-02-05": 135,
    };

    // Expected output when the date is not found
    const expectedOutput = [
      {
        date: "2024-02-10T00:00:00.000Z",
        totalDailyMinutes: 50,
        dailyPercentage: null,
      },
    ];

    // Run the function and compare the result to the expected output
    const result = addPercentagePerDayToRecords(records, totalDailyMinutes);
    expect(result).toEqual(expectedOutput);
  });

  it("should handle Date objects by converting them to ISO strings", () => {
    // Sample input with Date objects
    const records = [
      { date: new Date("2024-02-05T00:00:00.000Z"), totalDailyMinutes: 45 },
    ];

    // Total daily minutes for each date
    const totalDailyMinutes = {
      "2024-02-05": 135,
    };

    // Expected output
    const expectedOutput = [
      {
        date: "2024-02-05T00:00:00.000Z",
        totalDailyMinutes: 45,
        dailyPercentage: "33.33",
      },
    ];

    // Run the function and compare the result to the expected output
    const result = addPercentagePerDayToRecords(records, totalDailyMinutes);
    expect(result).toEqual(expectedOutput);
  });
});
