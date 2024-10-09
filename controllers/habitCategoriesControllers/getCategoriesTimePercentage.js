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

// Controller to handle percentage time calculations for habit categories
export const getCategoriesTimePercentage = async (req, res) => {
  const userId = req.query.userId;
  const { years, startDate, endDate } = req.query;
  let errorList = [];

  // Validate userId
  if (!userId) {
    errorList.push("User ID is required.");
  }

  // Validate required parameters
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

  // Return validation errors if any
  if (errorList.length > 0) {
    return res.status(400).json({ message: validationErrorMessage(errorList) });
  }

  try {
    logInfo(
      `Fetching category data for user ID: ${userId}, years: ${yearArray.join(
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
        $lt: new Date(
          new Date(endDate).setDate(new Date(endDate).getDate() + 1)
        ), // Make end date inclusive
      };
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

    // Generate category data with percentages
    const categoryStats = categories.map((category) => ({
      name: category.name,
      totalMinutes: category.totalMinutes,
      percentage:
        totalMinutes > 0
          ? ((category.totalMinutes / totalMinutes) * 100).toFixed(2)
          : 0,
    }));

    // Send the calculated stats in the response
    res.status(200).json({
      totalMinutes,
      categoryDataPercentage: categoryStats,
    });
  } catch (error) {
    logError(`Error fetching average category data: ${error}`);
    return res.status(500).json({
      message: "Error fetching average category data.",
      error: error.message,
    });
  }
};
