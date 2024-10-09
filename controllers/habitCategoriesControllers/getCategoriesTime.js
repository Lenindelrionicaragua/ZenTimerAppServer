import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

// Function to validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Controller to get categories time based on user and specified time period
export const getCategoriesTime = async (req, res) => {
  const userId = req.query.userId; // Get user ID from query parameters
  const { periodType, startDate, endDate } = req.query; // Extract parameters from query

  // Define valid period types
  const validPeriodTypes = ["day", "week", "month", "year"];
  let errorList = []; // Initialize list to collect validation errors

  // Validate period type
  if (!validPeriodTypes.includes(periodType)) {
    errorList.push("Invalid period type."); // Add error for invalid period type
  }

  // Validate date formats if periodType is not 'year'
  if (periodType !== "year") {
    if (!isValidDate(startDate)) {
      errorList.push("Invalid start date format. Expected format: YYYY-MM-DD."); // Error for invalid start date
    }

    if (endDate && !isValidDate(endDate)) {
      errorList.push("Invalid end date format. Expected format: YYYY-MM-DD."); // Error for invalid end date
    }
  }

  // Return validation errors if any
  if (errorList.length > 0) {
    return res.status(400).json({
      message: validationErrorMessage(errorList), // Return formatted validation errors
    });
  }

  try {
    logInfo(
      `Fetching categories for user ID: ${userId} for period: ${periodType}` // Log the request information
    );

    const filter = { createdBy: userId }; // Initialize filter for querying habit categories

    // Filter based on the period type
    if (periodType === "day") {
      filter.createdAt = {
        $gte: new Date(startDate), // Start of the day
        $lt: new Date(
          new Date(startDate).setDate(new Date(startDate).getDate() + 1) // End of the day
        ),
      };
    } else if (periodType === "week") {
      filter.createdAt = { $gte: new Date(startDate), $lt: new Date(endDate) }; // Filter for the week
    } else if (periodType === "month") {
      filter.createdAt = {
        $gte: new Date(startDate), // Start of the month
        $lt: new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 1) // End of the month
        ),
      };
    } else if (periodType === "year") {
      const year = new Date(startDate).getFullYear(); // Extract year from start date
      filter.createdAt = {
        $gte: new Date(year, 0, 1), // Start of the year
        $lt: new Date(year + 1, 0, 1), // Start of the next year
      };
    }

    // Query the database for categories matching the filter
    const categories = await HabitCategory.find(filter);

    // If no categories are found, return a 404 error
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this user." }); // No categories found
    }

    // Map the categories to the response format
    const categoryData = categories.map((category) => ({
      name: category.name,
      totalMinutes: category.totalMinutes,
    }));

    // Send the retrieved category data in the response
    res.status(200).json({ categoryData });
  } catch (error) {
    logError(`Error fetching category data: ${error}`); // Log the error
    res.status(500).json({ message: "Error fetching category data.", error }); // Return error response
  }
};
