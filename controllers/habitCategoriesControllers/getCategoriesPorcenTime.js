import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

const isValidYear = (yearString) => {
  const year = parseInt(yearString, 10);
  return !isNaN(year) && year > 0;
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const calculateAveragePerDay = (totalMinutes, yearArray) => {
  let totalDays = 0;
  yearArray.forEach((year) => {
    for (let month = 0; month < 12; month++) {
      totalDays += calculateDaysInMonth(new Date(year, month, 1));
    }
  });
  return totalDays > 0 ? totalMinutes / totalDays : 0; // Return 0 if no days
};

const calculateDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getCategoriesPorcenTime = async (req, res) => {
  const userId = req.user.id;
  const { years, startDate, endDate } = req.query;

  // Validate required parameters: both startDate and endDate must be provided together
  if (!years || (startDate && !endDate)) {
    return validationErrorMessage(
      res,
      "Both startDate and endDate are required if specifying a date range."
    );
  }

  // Validate year format
  const yearArray = years ? years.split(",") : [];
  if (yearArray.some((year) => !isValidYear(year))) {
    return validationErrorMessage(
      res,
      "Invalid year format. Expected format: YYYY."
    );
  }

  // Validate date formats
  if (
    startDate &&
    (!isValidDate(startDate) || (endDate && !isValidDate(endDate)))
  ) {
    return validationErrorMessage(
      res,
      "Invalid date format. Expected format: YYYY-MM-DD."
    );
  }

  // Validate date ranges are within the specified years
  if (startDate && endDate) {
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();

    if (yearArray.some((year) => year < startYear || year > endYear)) {
      return validationErrorMessage(
        res,
        "Start and end dates must be within the specified years."
      );
    }
  }

  try {
    logInfo(
      `Fetching average category data for user ID: ${userId}, years: ${yearArray.join(
        ", "
      )}`
    );

    const filter = { createdBy: userId };

    // Set filter for date range
    if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lt: new Date(
          new Date(endDate).setDate(new Date(endDate).getDate() + 1)
        ), // Inclusive end date
      };
    }

    // Handle multiple year filters
    if (yearArray.length > 0) {
      const yearFilters = yearArray.map((year) => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        return { createdAt: { $gte: startOfYear, $lt: endOfYear } };
      });
      filter.$or = yearFilters; // Combine with OR logic
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
    const averagePerWeek = totalMinutes / 4; // Simplified
    const averagePerMonth = totalMinutes / (12 * yearArray.length);

    const categoryStats = categories.map((category) => ({
      name: category.name,
      averageMinutes: {
        daily:
          category.totalMinutes /
          calculateDaysInMonth(new Date(category.createdAt)),
        weekly: category.totalMinutes / 4, // Simplified
        monthly: category.totalMinutes / 12, // Simplified
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