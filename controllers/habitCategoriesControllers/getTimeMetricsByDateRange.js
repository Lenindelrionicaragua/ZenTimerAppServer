import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import validateDateRange from "../../util/validateDateRange.js";

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId; // Get user ID from query parameters
  const { startDate, endDate } = req.body; // or query?

  // Validate date range using validateDateRange
  const dateValidationError = validateDateRange(startDate, endDate);

  // If validation fails, return the error message using validationErrorMessage
  if (dateValidationError) {
    return res.status(400).json({
      success: false,
      error: validationErrorMessage([dateValidationError]),
    });
  }

  // Logging the request
  logInfo(
    `Fetching categories for user ID: ${userId} for period: ${startDate} to ${endDate}`
  );

  try {
    // Obtener las categorías del usuario
    const categories = await HabitCategory.find({
      createdBy: userId, // Verificar que la categoría pertenece al usuario
    });

    // If no categories found, return a response with success=false and message
    if (!categories || categories.length === 0) {
      return res.status(200).json({
        success: true,
        msg: "No categories found for this user, but the request was successful.",
        totalMinutes: 0,
        categoryDataPercentage: [],
      });
    }

    // Convertir las fechas a objetos Date para las consultas
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filtrar los registros por el rango de fechas
    const filteredCategoryStats = await Promise.all(
      categories.map(async (category) => {
        // Obtener los registros diarios para cada categoría dentro del rango de fechas
        const filteredRecords = await DailyRecord.find({
          userId,
          categoryId: category._id,
          date: { $gte: start, $lte: end },
        });

        // Calcular el total de minutos para cada categoría
        const totalCategoryMinutes = filteredRecords.reduce(
          (total, record) => total + (record.minutes || 0),
          0
        );

        return {
          name: category.name,
          totalMinutes: totalCategoryMinutes,
          records: filteredRecords,
        };
      })
    );

    // Si no hay registros, retornamos 0 minutos y porcentajes, no un error
    const totalMinutes = filteredCategoryStats.reduce(
      (sum, category) => sum + category.totalMinutes,
      0
    );

    // Calcular el porcentaje por categoría
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
          totalMinutes,
          categoryDataPercentage: categoryDataWithPercentages,
        },
        null,
        2
      )}`
    );

    return res.status(200).json({
      success: true,
      totalMinutes,
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
