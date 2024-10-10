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
      query: {
        userId: "testUserId", // Set userId directly in query
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
    req.query.periodType = "invalid";
    await getCategoriesTime(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "BAD REQUEST: Invalid period type.",
    });
  });

  it("should return 400 if invalid date format", async () => {
    req.query.startDate = "invalid-date";
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
    req.query.periodType = "day";
    req.query.startDate = "2024-07-15";
    req.query.endDate = "2024-07-15";

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
    req.query.periodType = "week";
    req.query.startDate = "2024-07-01";
    req.query.endDate = "2024-07-07";

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
    req.query.periodType = "month";
    req.query.startDate = "2024-07-01";
    req.query.endDate = "2024-07-31";

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

  it("should create a new category without specifying time (totalMinutes or dailyRecords)", async () => {
    // Step 3: Create a new habit category without specifying totalMinutes or dailyRecords
    const newCategory = {
      habitCategory: {
        name: "Health",
        createdBy: userId, // Use the user id from login response
        createdAt: new Date(),
      },
    };

    // Send the request without time-related fields
    const response = await request
      .post("/api/test/habit-categories/create")
      .send(newCategory);

    // Step 4: Validate the creation response
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Category created successfully.");
    expect(response.body.category.name).toBe(newCategory.habitCategory.name);
    expect(response.body.category.createdBy).toEqual(userId);

    // Ensure the default value for time is set correctly (if totalMinutes defaults to 0)
    expect(response.body.category.totalMinutes).toBe(0); // Assuming the default is 0 for totalMinutes
  });

  it("should return categories for a specific year", async () => {
    req.query.periodType = "year";
    req.query.startDate = "2024-01-01";
    req.query.endDate = "2024-12-31";

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
