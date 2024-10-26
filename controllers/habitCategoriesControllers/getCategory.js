import HabitCategory from "../../models/habitCategory.js";
import { logInfo, logError } from "../../util/logging.js";

// Controller to retrieve all habit categories for a user
export const getCategory = async (req, res) => {
  const userId = req.userId;

  try {
    // Find all categories created by the user
    const userCategories = await HabitCategory.find({ createdBy: userId });

    // If no categories exist, return an empty array with a success message
    if (!userCategories || userCategories.length === 0) {
      return res.status(200).json({
        success: true,
        msg: "No categories found for this user, but the request was successful.",
        categories: [],
      });
    }

    // Map categories to a simplified structure
    const categoryData = userCategories.map((category) => ({
      id: category._id,
      name: category.name,
      createdAt: category.createdAt,
      dailyGoal: category.dailyGoal || 0, // Set default dailyGoal to 0 if undefined
    }));

    // Log the retrieval success
    logInfo(`Categories retrieved successfully for user ${userId}`);

    // Return a response containing all user categories
    return res.status(200).json({
      success: true,
      categories: categoryData,
    });
  } catch (error) {
    // Log any errors that occur during category retrieval
    logError(`Error fetching categories: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error fetching categories.",
      error: error.message,
    });
  }
};
