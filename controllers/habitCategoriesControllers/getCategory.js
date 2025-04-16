import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";

export const getCategory = async (req, res) => {
  const userId = req.userId;

  try {
    const userCategories = await HabitCategory.find({ createdBy: userId });

    if (!userCategories || userCategories.length === 0) {
      return res.status(200).json({
        success: true,
        msg: "No categories found for this user, but the request was successful.",
        categories: [],
      });
    }

    const categoryData = userCategories.map((category) => ({
      categoryId: category._id,
      name: category.name,
      dailyGoal: category.dailyGoal || 0,
      createdAt: category.createdAt,
      createdBy: category.createdBy,
    }));

    logInfo(
      `Response data: ${JSON.stringify(
        {
          success: true,
          categories: categoryData,
        },
        null,
        2,
      )}`,
    );

    return res.status(200).json({
      success: true,
      categories: categoryData,
    });
  } catch (error) {
    logError(`Error fetching categories: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching categories.",
      error: error.message,
    });
  }
};
