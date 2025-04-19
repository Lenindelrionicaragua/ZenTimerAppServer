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
  addPercentagePerDayToRecords,
} from "../../util/dataTransformations.js";

export const getWeeklyTimeMetrics = async (req, res) => {
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

    // Convert start and end date strings to Date objects and ensure valid dates
    start = new Date(startDate);
    end = new Date(endDate);

    // Ensure start date is not after end date
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
          totalMinutes: totalCategoryMinutes,
          records: simplifiedRecords,
        };
      }),
    );

    const totalMinutes = calculateTotalMinutes(categoryData);
    const allRecords = categoryData.flatMap((cat) => cat.records);
    const totalDailyMinutes = calculateDailyMinutes(allRecords);

    const categoryDataWithPercentages = categoryData.map((category) => {
      return {
        ...category,
        records: addPercentagePerDayToRecords(
          category.records,
          totalDailyMinutes,
        ),
      };
    });

    const categoryCount = countCategoriesWithData(categoryData, start, end);
    const daysWithRecords = countUniqueDays(categoryData);

    const categoryStats = calculateCategoryPercentages(
      categoryDataWithPercentages,
      totalMinutes,
    );

    // logInfo(
    //   `Response data getWeeklyTimeMetrics: ${JSON.stringify(
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
