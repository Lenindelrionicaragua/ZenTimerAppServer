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
  const { month, year, categoryId } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      error: "Both 'month' and 'year' are required in the query parameters.",
    });
  }

  let start, end;
  try {
    const { startDate, endDate } = getMonthRange(month, year);

    start = new Date(startDate);
    end = new Date(endDate);

    if (start > end) {
      [start, end] = [end, start];
      logInfo("Date range was reversed by the server");
    }
  } catch (error) {
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

        const simplifiedRecords = mapRecordsToDateAndMinutes(categoryRecords);

        const totalCategoryMinutes = categoryRecords.reduce(
          (total, record) => total + (record.totalDailyMinutes || 0),
          0,
        );

        return {
          name: category.name,
          dailyGoal: category.dailyGoal,
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

    const totalMinutes = calculateTotalMinutes(categoryData);

    const allRecords = categoryData.flatMap((cat) => cat.records);
    const totalDailyMinutes = calculateDailyMinutes(allRecords);

    // Count the number of categories with data
    const categoryCount = countCategoriesWithData(categoryData, start, end);
    const daysWithRecords = countUniqueDays(categoryData);

    const categoryStats = calculateCategoryPercentages(
      cleanedCategoryStats,
      totalMinutes,
    );

    // logInfo(
    //   `Response data MonthlyTimeMetrics: ${JSON.stringify(
    //     {
    //       success: true,
    //       totalMinutes: totalMinutes,
    //       categoryCount: categoryCount,
    //       daysWithRecords: daysWithRecords,
    //       totalDailyMinutes: totalDailyMinutes,
    //       categoryData: categoryStats,
    //     },
    //     null,
    //     2,
    //   )}`,
    // );

    return res.status(200).json({
      success: true,
      totalMinutes: totalMinutes,
      categoryCount: categoryCount,
      daysWithRecords: daysWithRecords,
      totalDailyMinutes: totalDailyMinutes,
      categoryData: categoryStats,
    });
  } catch (error) {
    logError(`Error fetching category data: ${error.message}`);
    const generalError = validationErrorMessage([error.message]);

    return res.status(500).json({
      success: false,
      message: "Error fetching category data.",
      error: generalError,
    });
  }
};
