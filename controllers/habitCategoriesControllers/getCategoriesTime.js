import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";

export const getCategoriesTime = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is stored in the token
  const { periodType, startDate, endDate } = req.query; // Periodo que el usuario quiere consultar

  try {
    logInfo(
      `Fetching categories for user ID: ${userId} for period: ${periodType}`
    );

    // Filtrado de categorías creadas por el usuario
    const filter = { createdBy: userId };

    // Establecer filtros basados en el tipo de periodo
    if (periodType === "day") {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lt: new Date(startDate).setDate(new Date(startDate).getDate() + 1),
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
