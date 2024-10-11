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
    errorList.push("Years, periodType, startDate, and endDate are required.");
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

    // Build date filters based on periodType
    let dateFilter = {};

    if (periodType === "year") {
      const year = yearArray[0]; // Assuming only one year is passed
      const startOfYear = new Date(year, 0, 1); // Start of the year
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // End of the year
      dateFilter = { $gte: startOfYear, $lte: endOfYear };
    } else if (periodType === "month") {
      const month = new Date(startDate).getMonth(); // Get month from startDate
      const startOfMonth = new Date(yearArray[0], month, 1);
      const endOfMonth = new Date(yearArray[0], month + 1, 0, 23, 59, 59, 999);
      dateFilter = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (periodType === "week" || periodType === "day") {
      const startOfPeriod = new Date(startDate);
      const endOfPeriod = new Date(endDate || startDate);
      endOfPeriod.setHours(23, 59, 59, 999); // End of the day or week
      dateFilter = { $gte: startOfPeriod, $lte: endOfPeriod };
    }

    // Query the database for categories matching the filter
    const categories = await HabitCategory.find(filter);

    // If no categories are found, return a 404 error
    if (!categories || categories.length === 0) {
      return res.status(404).json({
        message: "No categories found for this user in the given time period.",
      });
    }

    // Calculate total minutes by filtering daily records within the date range
    let totalMinutes = 0;
    const categoryStats = categories.map((category) => {
      const filteredDailyRecords = category.dailyRecords.filter((record) => {
        if (!record.date) return false;

        const recordDate = new Date(record.date);
        const startDate = new Date(dateFilter.$gte);
        const endDate = new Date(dateFilter.$lte);

        const isInDateRange = recordDate >= startDate && recordDate <= endDate;
        logInfo(
          `Checking record date: ${recordDate}, Is in range: ${isInDateRange}`
        );

        return isInDateRange;
      });

      logInfo(
        `Filtered records for category ${category.name}: ${JSON.stringify(
          filteredDailyRecords,
          null,
          2
        )}`
      );

      // Debug log for filtered minutes
      logInfo(
        `Minutes in filtered records for category ${
          category.name
        }: ${filteredDailyRecords.map((record) => record.minutes)}`
      );

      // Sum the total minutes for the filtered records
      const totalCategoryMinutes = filteredDailyRecords.reduce(
        (recordSum, record) => recordSum + (record.minutes || 0), // Use 'minutes' instead of 'totalMinutes'
        0
      );

      totalMinutes += totalCategoryMinutes;

      return {
        name: category.name,
        totalMinutes: totalCategoryMinutes,
        percentage:
          totalMinutes > 0
            ? ((totalCategoryMinutes / totalMinutes) * 100).toFixed(2)
            : 0,
      };
    });

    // Send the calculated stats in the response
    logInfo(`Total minutes across all categories: ${totalMinutes}`);
    logInfo(
      `Category percentage data: ${JSON.stringify(categoryStats, null, 2)}`
    );

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
