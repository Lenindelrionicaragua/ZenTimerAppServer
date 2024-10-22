import { calculateDailyMinutes } from "../../util/calculations";

// Test data for records only (not grouped by categories)
const recordsMock = [
  { date: new Date("2023-10-01"), totalDailyMinutes: 120 },
  { date: new Date("2023-10-01"), totalDailyMinutes: 60 },
  { date: new Date("2023-10-02"), totalDailyMinutes: 180 },
  { date: new Date("2023-10-02"), totalDailyMinutes: 90 },
  { date: new Date("2023-10-03"), totalDailyMinutes: 90 },
];

// Empty test data
const emptyRecordsMock = [];

describe("calculateDailyMinutes", () => {
  it("should correctly calculate total minutes for each day from a list of records", () => {
    const dailyMinutes = calculateDailyMinutes(recordsMock);

    expect(dailyMinutes).toEqual({
      "2023-10-01": 180, // 120 + 60
      "2023-10-02": 270, // 180 + 90
      "2023-10-03": 90, // 90
    });
  });

  it("should return an empty object if no records are provided", () => {
    const dailyMinutes = calculateDailyMinutes(emptyRecordsMock);

    expect(dailyMinutes).toEqual({}); // No records should yield an empty object
  });
});
