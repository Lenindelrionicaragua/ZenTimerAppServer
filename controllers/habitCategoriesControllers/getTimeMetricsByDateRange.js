import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import {
  calculateTotalMinutes,
  calculateCategoryPercentages,
} from "../../util/calculations.js";
import {
  mapRecordsToDateAndMinutes,
  countUniqueDays,
  countCategoriesWithData,
} from "../../util/dataTransformations.js";

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId;
  const { startDate, endDate, categoryId } = req.query;

  // Convert start and end date strings to Date objects and ensure valid dates
  let start = new Date(startDate);
  let end = new Date(endDate);

  // Check for invalid date formats
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format. Please use YYYY-MM-DD format.",
    });
  }

  // Ensure start date is not after end date
  if (start > end) {
    [start, end] = [end, start];
    logInfo("Date range was reversed by the server");
  }

  // Set start and end time to cover the full day
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  try {
    let userCategories;

    // Get the categories for the user, optionally filtering by categoryId
    if (categoryId) {
      userCategories = await HabitCategory.find({
        _id: categoryId,
        createdBy: userId,
      });

      if (!userCategories.length) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
    } else {
      userCategories = await HabitCategory.find({ createdBy: userId });

      if (!userCategories || userCategories.length === 0) {
        return res.status(200).json({
          success: true,
          msg: "No categories found for this user, but the request was successful.",
          totalMinutes: 0,
          categoryCount: 0,
          daysWithRecords: 0,
          categoryData: [],
        });
      }
    }

    // Process each category and get its associated records and statistics
    const categoryData = await Promise.all(
      userCategories.map(async (category) => {
        // Fetch records for the category within the date range
        const categoryRecords = await DailyTimeRecord.find({
          userId,
          categoryId: category._id,
          date: { $gte: start, $lte: end },
        });

        // Map the records to just the date and total minutes
        const simplifiedRecords = mapRecordsToDateAndMinutes(categoryRecords);

        // Calculate total minutes for the category
        const totalCategoryMinutes = categoryRecords.reduce(
          (total, record) => total + (record.totalDailyMinutes || 0),
          0,
        );

        return {
          name: category.name,
          totalMinutes: totalCategoryMinutes,
          records: simplifiedRecords,
        };
      }),
    );

    const cleanedCategoryStats = categoryData.map((category) => {
      // eslint-disable-next-line no-unused-vars
      const { records, ...cleanCategory } = category; // Remove records
      return cleanCategory;
    });

    // Calculate total minutes across all categories
    const totalMinutes = calculateTotalMinutes(categoryData);
    // Count the number of categories with data
    const categoryCount = countCategoriesWithData(categoryData, start, end);
    // Count the unique days that have records
    const daysWithRecords = countUniqueDays(categoryData);

    // Add percentage data to each category
    const categoryStats = calculateCategoryPercentages(
      cleanedCategoryStats,
      totalMinutes,
    );

    // Log the response data for debugging
    logInfo(
      `Response data: ${JSON.stringify(
        {
          success: true,
          totalMinutes: totalMinutes,
          categoryCount: categoryCount,
          daysWithRecords: daysWithRecords,
          categoryData: categoryStats,
        },
        null,
        2,
      )}`,
    );

    // Return the response
    return res.status(200).json({
      success: true,
      totalMinutes: totalMinutes,
      categoryCount: categoryCount,
      daysWithRecords: daysWithRecords,
      categoryData: categoryStats,
    });
  } catch (error) {
    // Log the error and return a general error response
    logError(`Error fetching category data: ${error.message}`);
    const generalError = validationErrorMessage([error.message]);

    return res.status(500).json({
      success: false,
      message: "Error fetching category data.",
      error: generalError,
    });
  }
};
