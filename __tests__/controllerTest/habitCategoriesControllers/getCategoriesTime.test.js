import { getCategoriesTime } from "../../../controllers/habitCategoriesControllers/getCategoriesTime.js";
import HabitCategory from "../../../models/habitCategory.js";
import { logInfo, logError } from "../../../util/logging.js";

// Mock the dependencies
jest.mock("../../../models/habitCategory.js");
jest.mock("../../../util/logging.js");

describe("getCategoriesTime Controller", () => {
  let req, res;

  beforeEach(() => {
    // Create a mock request and response
    req = {
      user: { id: "testUserId" }, // Mock user ID
      body: {
        periodType: "month",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return categories for the specified period", async () => {
    HabitCategory.find.mockResolvedValue([
      { name: "Work", totalMinutes: 120 },
      { name: "Exercise", totalMinutes: 60 },
    ]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryData: [
        { name: "Work", totalMinutes: 120 },
        { name: "Exercise", totalMinutes: 60 },
      ],
    });
    expect(logInfo).toHaveBeenCalledWith(
      `Fetching categories for user ID: testUserId for period: month`
    );
  });

  it("should return 404 if no categories found", async () => {
    HabitCategory.find.mockResolvedValue([]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "No categories found for this user.",
    });
  });

  it("should return 400 if invalid period type", async () => {
    req.body.periodType = "invalid";
    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "BAD REQUEST: Invalid period type.",
    });
  });

  it("should return 400 if invalid date format", async () => {
    req.body.startDate = "invalid-date";
    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message:
        "BAD REQUEST: Invalid start date format. Expected format: YYYY-MM-DD.",
    });
  });

  it("should return 500 on unexpected error", async () => {
    // Mock an unexpected error
    HabitCategory.find.mockRejectedValue(new Error("Database error"));

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error fetching category data.",
      error: expect.any(Error),
    });
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining("Error fetching category data:")
    );
  });

  // Test cases for specific time periods
  it("should return categories for a specific day", async () => {
    req.body.periodType = "day";
    req.body.startDate = "2024-07-15";
    req.body.endDate = "2024-07-15";

    HabitCategory.find.mockResolvedValue([
      { name: "Work", totalMinutes: 120, createdAt: new Date("2024-07-15") },
      { name: "Exercise", totalMinutes: 60, createdAt: new Date("2024-07-15") },
    ]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryData: [
        { name: "Work", totalMinutes: 120 },
        { name: "Exercise", totalMinutes: 60 },
      ],
    });
  });

  it("should return categories for a specific week", async () => {
    req.body.periodType = "week";
    req.body.startDate = "2024-07-01";
    req.body.endDate = "2024-07-07";

    HabitCategory.find.mockResolvedValue([
      { name: "Work", totalMinutes: 120, createdAt: new Date("2024-07-01") },
      { name: "Exercise", totalMinutes: 60, createdAt: new Date("2024-07-05") },
    ]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryData: [
        { name: "Work", totalMinutes: 120 },
        { name: "Exercise", totalMinutes: 60 },
      ],
    });
  });

  it("should return categories for a specific month", async () => {
    req.body.periodType = "month";
    req.body.startDate = "2024-07-01";
    req.body.endDate = "2024-07-31";

    HabitCategory.find.mockResolvedValue([
      { name: "Work", totalMinutes: 120, createdAt: new Date("2024-07-15") },
      { name: "Exercise", totalMinutes: 60, createdAt: new Date("2024-07-20") },
    ]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryData: [
        { name: "Work", totalMinutes: 120 },
        { name: "Exercise", totalMinutes: 60 },
      ],
    });
  });

  it("should return categories for a specific year", async () => {
    req.body.periodType = "year";
    req.body.startDate = "2024-01-01";
    req.body.endDate = "2024-12-31";

    HabitCategory.find.mockResolvedValue([
      { name: "Work", totalMinutes: 120, createdAt: new Date("2024-07-15") },
      { name: "Exercise", totalMinutes: 60, createdAt: new Date("2024-07-20") },
    ]);

    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      categoryData: [
        { name: "Work", totalMinutes: 120 },
        { name: "Exercise", totalMinutes: 60 },
      ],
    });
  });
});
