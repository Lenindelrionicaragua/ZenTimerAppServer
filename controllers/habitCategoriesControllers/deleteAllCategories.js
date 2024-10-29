import HabitCategory from "../../models/habitCategory.js";
import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import { logError, logInfo } from "../../util/logging.js";

export const deleteAllCategories = async (req, res) => {
  const userId = req.userId;

  try {
    // Find all categories created by the user
    const categories = await HabitCategory.find({ createdBy: userId });

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        msg: `No categories found for the user.`,
      });
    }

    // Extract all category IDs
    const categoryIds = categories.map((category) => category._id);

    // Delete all daily records associated with these categories
    await DailyTimeRecord.deleteMany({ categoryId: { $in: categoryIds } });

    // Now delete all categories for the user
    await HabitCategory.deleteMany({ createdBy: userId });

    // Return success response
    return res.status(200).json({
      success: true,
      msg: `All categories and their associated records have been deleted.`,
    });
  } catch (error) {
    logError("Error deleting all categories:", error);
    return res.status(500).json({
      success: false,
      msg: "An error occurred while deleting all categories.",
      error: error.message,
    });
  }
};
