import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

export const getCategoriesPorcenTime = async (req, res) => {
  const userId = req.user.id;
  const { years } = req.query;

  // Split years into an array and validate
  const yearArray = years ? years.split(",") : [];
  if (yearArray.some((year) => !isValidYear(year))) {
    return validationErrorMessage(
      res,
      "Invalid year format. Expected format: YYYY."
    );
  }

  try {
    logInfo(
      `Fetching average category data for user ID: ${userId} for years: ${yearArray.join(
        ", "
      )}`
    );

    const filter = { createdBy: userId };

    if (yearArray.length > 0) {
      const yearFilters = yearArray.map((year) => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        return { createdAt: { $gte: startOfYear, $lt: endOfYear } };
      });
      filter.$or = yearFilters;
    }

    const categories = await HabitCategory.find(filter);
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this user." });
    }

    const totalMinutes = categories.reduce(
      (sum, category) => sum + category.totalMinutes,
      0
    );

    const averagePerDay = calculateAveragePerDay(totalMinutes, yearArray);
    const averagePerWeek = totalMinutes / 4;
    const averagePerMonth = totalMinutes / (12 * yearArray.length);

    const categoryStats = categories.map((category) => ({
      name: category.name,
      averageMinutes: {
        daily:
          category.totalMinutes /
          calculateDaysInMonth(new Date(category.createdAt)),
        weekly: category.totalMinutes / 4,
        monthly: category.totalMinutes / 12,
      },
    }));

    res.status(200).json({
      totalMinutes,
      averagePerDay,
      averagePerWeek,
      averagePerMonth,
      categoryStats,
    });
  } catch (error) {
    logError(`Error fetching average category data: ${error}`);
    res
      .status(500)
      .json({ message: "Error fetching average category data.", error });
  }
};

// Function to validate year format
const isValidYear = (yearString) => {
  const year = parseInt(yearString, 10);
  return !isNaN(year) && year > 0;
};

// Function to calculate average per day with actual days in month
const calculateAveragePerDay = (totalMinutes, yearArray) => {
  let totalDays = 0;
  yearArray.forEach((year) => {
    for (let month = 0; month < 12; month++) {
      totalDays += calculateDaysInMonth(new Date(year, month, 1));
    }
  });
  return totalDays > 0 ? totalMinutes / totalDays : 0; // Return 0 if no days
};

// Function to get the number of days in a month
const calculateDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};
