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
  const { years, periodType, startDate, endDate } = req.query;
  let errorList = [];

  // Validate userId
  if (!userId) {
    errorList.push("User ID is required.");
  }

  // Validate required parameters
  if (!years || !periodType || (!startDate && !endDate)) {
    errorList.push("Years, periodType, startDate and endDate are required.");
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
      )}, periodType: ${periodType}, startDate: ${startDate}, endDate: ${endDate}`
    );

    // Initialize filter for querying habit categories
    const filter = { createdBy: userId };

    // Set date filters based on the periodType
    if (periodType === "month") {
      const year = yearArray[0]; // Assuming only one year is passed
      const month = new Date(startDate).getMonth(); // Get month from startDate
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of the month

      filter.createdAt = { $gte: startOfMonth, $lte: endOfMonth }; // Filtering for the month
    } else if (periodType === "day") {
      if (startDate) {
        const year = new Date(startDate).getFullYear(); // Get the year from startDate
        const startOfDay = new Date(
          `${year}-${startDate.split("-")[1]}-${startDate.split("-")[2]}`
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999); // End of the day

        filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    } else if (periodType === "week") {
      // Filter by week, ensuring the year is respected
      if (startDate && endDate) {
        const startOfWeek = new Date(startDate);
        const endOfWeek = new Date(endDate);
        endOfWeek.setHours(23, 59, 59, 999); // End of the week (Sunday)

        filter.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
      }
    } else if (startDate && endDate) {
      // General date range filter
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Query the database for categories matching the filter
    const categories = await HabitCategory.find(filter);

    // If no categories are found, return a 404 error
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({
          message:
            "No categories found for this user in the given time period.",
        });
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
    logError(`Error fetching category data: ${error}`);
    return res.status(500).json({
      message: "Error fetching category data.",
      error: error.message,
    });
  }
};
