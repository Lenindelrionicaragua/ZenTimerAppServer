import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import {
  calculateTotalMinutes,
  addPercentageToCategories,
} from "../../util/calculations.js";

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId;
  let { startDate, endDate, categoryId } = req.query;

  let start = new Date(startDate);
  let end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format. Please use YYYY-MM-DD format.",
    });
  }

  if (start > end) {
    [start, end] = [end, start];
    logInfo("Date range was reversed by the server");
  }

  // logInfo(`Adjusted start date: ${start.toISOString()}`);
  // logInfo(`Adjusted end date: ${end.toISOString()}`);

  try {
    let categories;
    if (categoryId) {
      categories = await HabitCategory.find({
        _id: categoryId,
        createdBy: userId,
      });
      if (!categories.length) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
    } else {
      categories = await HabitCategory.find({ createdBy: userId });
      if (!categories || categories.length === 0) {
        return res.status(200).json({
          success: true,
          msg: "No categories found for this user, but the request was successful.",
          totalMinutes: 0,
          categoryData: [],
        });
      }
    }

    const filteredCategoryStats = await Promise.all(
      categories.map(async (category) => {
        const filteredRecords = await DailyRecord.find({
          userId,
          categoryId: category._id,
          date: { $gte: start, $lte: end },
        });

        const totalCategoryMinutes = filteredRecords.reduce(
          (total, record) => total + (record.totalDailyMinutes || 0),
          0
        );

        return {
          name: category.name,
          totalMinutes: totalCategoryMinutes,
          records: filteredRecords,
        };
      })
    );

    const totalMinutes = calculateTotalMinutes(filteredCategoryStats);
    const categoryStatsWithPercentage = addPercentageToCategories(
      filteredCategoryStats,
      totalMinutes
    );

    logInfo(
      `Response data: ${JSON.stringify(
        {
          totalMinutes: totalMinutes,
          categoryData: categoryStatsWithPercentage,
        },
        null,
        2
      )}`
    );

    return res.status(200).json({
      success: true,
      totalMinutes: totalMinutes,
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
