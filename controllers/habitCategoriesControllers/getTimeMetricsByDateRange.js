import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import {
  calculateTotalMinutes,
  calculatePercentages,
} from "../../util/calculations.js";

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId;
  let { startDate, endDate } = req.query;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format. Please use YYYY-MM-DD format.",
    });
  }

  logInfo(`Adjusted start date: ${start.toISOString()}`);
  logInfo(`Adjusted end date: ${end.toISOString()}`);

  try {
    const categories = await HabitCategory.find({ createdBy: userId });

    if (!categories || categories.length === 0) {
      return res.status(200).json({
        success: true,
        msg: "No categories found for this user, but the request was successful.",
        totalMinutes: 0,
        categoryDataPercentage: [],
      });
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
    const categoryDataWithPercentages = calculatePercentages(
      filteredCategoryStats,
      totalMinutes
    );

    logInfo(
      `Response data: ${JSON.stringify(
        {
          totalMinutes: totalMinutes,
          categoryDataPercentage: categoryDataWithPercentages,
        },
        null,
        2
      )}`
    );

    return res.status(200).json({
      success: true,
      totalMinutes: totalMinutes,
      categoryDataPercentage: categoryDataWithPercentages,
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
