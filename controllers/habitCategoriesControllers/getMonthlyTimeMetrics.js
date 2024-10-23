import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import {
  calculateTotalMinutes,
  calculateCategoryPercentages,
  calculateDailyMinutes,
} from "../../util/calculations.js";
import { getMonthRange } from "../../util/dateUtils.js";
import {
  mapRecordsToDateAndMinutes,
  countUniqueDays,
  countCategoriesWithData,
} from "../../util/dataTransformations.js";

export const getMonthlyTimeMetrics = async (req, res) => {
  const userId = req.userId;
  let { month, year, categoryId } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      error: "Both 'month' and 'year' are required in the query parameters.",
    });
  }

  let start, end;
  try {
    // Call getMonthRange inside try-catch to handle potential errors
    const { startDate, endDate } = getMonthRange(month, year);

    // Convert start and end date strings to Date objects and ensure valid dates
    start = new Date(startDate);
    end = new Date(endDate);

    // Ensure start date is not after end date
    if (start > end) {
      [start, end] = [end, start];
      logInfo("Date range was reversed by the server");
    }
  } catch (error) {
    // Catch errors from getMonthRange and return a structured error response
    logError(`Error in getMonthRange: ${error.message}`);
    const generalError = validationErrorMessage([error.message]);

    return res.status(404).json({
      success: false,
      error: generalError,
    });
  }

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
          categoryCount: 0,
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
          0
        );

        return {
          name: category.name,
          totalMinutes: totalCategoryMinutes,
          records: simplifiedRecords,
        };
      })
    );

    const cleanedCategoryStats = categoryData.map((category) => {
      const { records, ...cleanCategory } = category; // Remove records
      return cleanCategory;
    });

    // Calculate total minutes across all categories
    const totalMinutes = calculateTotalMinutes(categoryData);

    // Combine all records to calculate total daily minutes
    const allRecords = categoryData.flatMap((cat) => cat.records);
    const totalDailyMinutes = calculateDailyMinutes(allRecords);

    // Count the number of categories with data
    const categoryCount = countCategoriesWithData(categoryData, start, end);
    // Count the unique days that have records
    const daysWithRecords = countUniqueDays(categoryData);

    // Add percentage data to each category
    const categoryStats = calculateCategoryPercentages(
      cleanedCategoryStats,
      totalMinutes
    );

    // Log the response data for debugging
    logInfo(
      `Response data: ${JSON.stringify(
        {
          success: true,
          totalMinutes: totalMinutes,
          categoryCount: categoryCount,
          daysWithRecords: daysWithRecords,
          totalDailyMinutes: totalDailyMinutes,
          categoryData: categoryStats,
        },
        null,
        2
      )}`
    );

    // Return the response
    return res.status(200).json({
      success: true,
      totalMinutes: totalMinutes,
      categoryCount: categoryCount,
      daysWithRecords: daysWithRecords,
      totalDailyMinutes: totalDailyMinutes,
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
