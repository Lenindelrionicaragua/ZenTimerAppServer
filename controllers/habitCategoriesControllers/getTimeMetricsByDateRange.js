import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";
import DailyRecord, {
  validateDailyRecords,
} from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

// const isValidDate = (dateString) => {
//   const date = new Date(dateString);
//   return !isNaN(date.getTime());
// };

// Controller to get categories time based on user and specified time period
export const getTimeMetricsByDateRange = async (req, res) => {
  const userId = req.userId; // Get user ID from query parameters
  const { startDate, endDate } = req.body; // or query?

  // Validate the request body using validateDailyRecords
  const errorList = validateDailyRecords({
    userId,
    categoryId,
    minutesUpdate,
    date,
  });

  if (errorList.length > 0) {
    logInfo(
      `Validation failed for user ${userId} and category ${categoryId}. Errors: ${JSON.stringify(
        errorList
      )}`
    );
    return res.status(400).json({ success: false, errors: errorList });
  }

  // Logging request
  logInfo(
    `Fetching categories for user ID: ${userId} for period: ${startDate} to ${endDate}`
  );

  try {
    // Obtener las categorías del usuario
    const categories = await HabitCategory.find({
      createdBy: userId, // Verificar que la categoría pertenece al usuario
    });

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No categories found for this user.",
      });
    }

    // Normalizar las fechas
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

    // Calcular el total de minutos acumulados
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

    // Enviar la respuesta
    logInfo(`Total minutes across all categories: ${totalMinutes}`);
    res.status(200).json({
      totalMinutes,
      categoryDataPercentage: categoryDataWithPercentages,
    });
  } catch (error) {
    const validationErrors = validationErrorMessage(error);
    if (validationErrors) {
      logInfo(
        `Validation error while processing the record for user ${userId} and category ${categoryId}: ${JSON.stringify(
          validationErrors
        )}`
      );
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    logError(`Error fetching category data: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching category data.",
      error: error.message,
    });
  }
};
