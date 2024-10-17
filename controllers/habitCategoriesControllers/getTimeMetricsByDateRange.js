import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId;
  let { startDate, endDate } = req.query; // Use params for date range

  // Convert startDate and endDate to Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ensure startDate is at the beginning of the day and endDate at the end
  start.setUTCHours(0, 0, 0, 0); // Set to 00:00:00 for startDate
  end.setUTCHours(23, 59, 59, 999); // Set to 23:59:59 for endDate

  // Validate that startDate and endDate are valid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format. Please use YYYY-MM-DD format.",
    });
  }

  logInfo(`Adjusted start date: ${start.toISOString()}`);
  logInfo(`Adjusted end date: ${end.toISOString()}`);

  try {
    const categories = await HabitCategory.find({
      createdBy: userId,
    });

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
          date: { $gte: start, $lte: end }, // Filter by date range
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

    const totalMinutes = filteredCategoryStats.reduce(
      (sum, category) => sum + category.totalMinutes,
      0
    );

    const categoryDataWithPercentages = filteredCategoryStats.map(
      (category) => {
        const percentage =
          totalMinutes > 0
            ? ((category.totalMinutes / totalMinutes) * 100).toFixed(2)
            : 0;
        return {
          ...category,
          percentage,
        };
      }
    );

    // Response with data
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
    // Log the actual error if something goes wrong
    logError(`Error fetching category data: ${error.message}`);

    // Return a generic error response with validationErrorMessage (if needed)
    const generalError = validationErrorMessage([error.message]);

    return res.status(500).json({
      success: false,
      message: "Error fetching category data.",
      error: generalError,
    });
  }
};
