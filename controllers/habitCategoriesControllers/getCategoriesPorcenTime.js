import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";

export const getCategoriesPorcenTime = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is stored in the token

  try {
    logInfo(`Fetching average category data for user ID: ${userId}`);

    const categories = await HabitCategory.find({ createdBy: userId }); // Obtener todas las categorías del usuario
    if (!categories || categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found for this user." });
    }

    const totalMinutes = categories.reduce(
      (sum, category) => sum + category.totalMinutes,
      0
    ); // Total de minutos
    const averagePerDay = totalMinutes / 30; // Aproximado mensual
    const averagePerWeek = totalMinutes / 4; // Aproximado semanal
    const averagePerMonth = totalMinutes / 12; // Aproximado anual

    const categoryStats = categories.map((category) => ({
      name: category.name,
      averageMinutes: {
        daily: category.totalMinutes / 30,
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
