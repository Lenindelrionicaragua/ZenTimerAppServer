import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

// Utility to validate year format
const isValidYear = (yearString) => {
  const year = parseInt(yearString, 10);
  return !isNaN(year) && year > 0;
};

// Utility to validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Utility to calculate average per day for a given year
const calculateAveragePerDay = (totalMinutes, yearArray) => {
  let totalDays = 0;
  yearArray.forEach((year) => {
    for (let month = 0; month < 12; month++) {
      totalDays += calculateDaysInMonth(new Date(year, month, 1));
    }
  });
  return totalDays > 0 ? totalMinutes / totalDays : 0;
};

// Utility to calculate days in a month
const calculateDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Controller to handle percentage time calculations for habit categories
export const getCategoriesTimePercentage = async (req, res) => {
  const userId = req.query.userId; // Get userId from query params
  const { years, startDate, endDate, periodType } = req.query;

  // Error list to collect all validation errors
  let errorList = [];

  // Validate required parameters:
  if (!years || (!startDate && !endDate)) {
    errorList.push(
      "Both startDate and endDate are required if specifying a date range."
    );
  }

  // Validate year format
  const yearArray = years ? years.split(",") : [];
  if (yearArray.some((year) => !isValidYear(year))) {
    errorList.push("Invalid year format. Expected format: YYYY.");
  }

  // Validate date formats
  if (startDate && !isValidDate(startDate)) {
    errorList.push("Invalid start date format. Expected format: YYYY-MM-DD.");
  }
  if (endDate && !isValidDate(endDate)) {
    errorList.push("Invalid end date format. Expected format: YYYY-MM-DD.");
  }

  // Validate that the date range is within the specified years
  if (startDate && endDate) {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    if (yearArray.some((year) => year < startYear || year > endYear)) {
      errorList.push("Start and end dates must be within the specified years.");
    }
  }

  // Return validation errors if any
  if (errorList.length > 0) {
    return res.status(400).json({ message: validationErrorMessage(errorList) });
  }

  try {
    logInfo(
      `Fetching average category data for user ID: ${userId}, years: ${yearArray.join(
        ", "
      )}`
    );

    // Initialize filter for querying habit categories
    const filter = { createdBy: userId };

    // Apply date range filter if provided
    if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lt: new Date(
          new Date(endDate).setDate(new Date(endDate).getDate() + 1)
        ), // Make end date inclusive
      };
    }

    // Handle year and month-based filtering if years are provided
    if (yearArray.length > 0) {
      const yearFilters = yearArray.map((year) => {
        if (periodType === "month") {
          const monthStart = new Date(year, 0, 1); // Start of the year
          const monthEnd = new Date(year, 11, 31, 23, 59, 59, 999); // End of the year
          return { createdAt: { $gte: monthStart, $lt: monthEnd } }; // Entire year range
        } else {
          const startOfYear = new Date(year, 0, 1);
          const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
          return { createdAt: { $gte: startOfYear, $lt: endOfYear } };
        }
      });
      filter.$or = yearFilters; // Combine year filters with OR logic
    }

    // Query the database for categories matching the filter
    const categories = await HabitCategory.find(filter);

    // If no categories are found, return a 404 error
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this user." });
    }

    // Calculate total minutes for all categories
    const totalMinutes = categories.reduce(
      (sum, category) => sum + category.totalMinutes,
      0
    );

    // Calculate average time per day, week, and month
    const averagePerDay = calculateAveragePerDay(totalMinutes, yearArray);
    const averagePerWeek = totalMinutes / 4; // Simplified weekly calculation
    const averagePerMonth = totalMinutes / (12 * yearArray.length); // Simplified monthly calculation

    // Generate category data to return
    const categoryData = categories.map((category) => ({
      name: category.name,
      totalMinutes: category.totalMinutes,
      averageMinutes: {
        daily:
          category.totalMinutes /
          calculateDaysInMonth(new Date(category.createdAt)),
        weekly: category.totalMinutes / 4, // Simplified weekly calculation
        monthly: category.totalMinutes / 12, // Simplified monthly calculation
      },
    }));

    // Send the calculated stats in the response
    res.status(200).json({
      totalMinutes,
      categoryData, // Return the category data consistently
    });
  } catch (error) {
    logError(`Error fetching average category data: ${error}`);
    return res.status(500).json({
      message: "Error fetching average category data.",
      error: error.message,
    });
  }
};
