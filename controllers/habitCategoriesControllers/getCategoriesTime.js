import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

export const getCategoriesTime = async (req, res) => {
  const userId = req.user.id;
  const { periodType, startDate, endDate } = req.query;

  // Validate input parameters
  const validPeriodTypes = ["day", "week", "month", "year"];

  if (!validPeriodTypes.includes(periodType)) {
    return validationErrorMessage(res, "Invalid period type.");
  }

  // Validate dates
  if (!isValidDate(startDate) || (endDate && !isValidDate(endDate))) {
    return validationErrorMessage(
      res,
      "Invalid date format. Expected format: YYYY-MM-DD."
    );
  }

  try {
    logInfo(
      `Fetching categories for user ID: ${userId} for period: ${periodType}`
    );

    const filter = { createdBy: userId };

    // Filter based on the period type
    if (periodType === "day") {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lt: new Date(
          new Date(startDate).setDate(new Date(startDate).getDate() + 1)
        ),
      };
    } else if (periodType === "week") {
      filter.createdAt = { $gte: new Date(startDate), $lt: new Date(endDate) };
    } else if (periodType === "month") {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lt: new Date(
          new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)
        ),
      };
    } else if (periodType === "year") {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lt: new Date(
          new Date(startDate).setFullYear(new Date(startDate).getFullYear() + 1)
        ),
      };
    }

    const categories = await HabitCategory.find(filter);

    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this user." });
    }

    const categoryData = categories.map((category) => ({
      name: category.name,
      totalMinutes: category.totalMinutes,
    }));

    res.status(200).json({ categoryData });
  } catch (error) {
    logError(`Error fetching category data: ${error}`);
    res.status(500).json({ message: "Error fetching category data.", error });
  }
};

// Function to validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
