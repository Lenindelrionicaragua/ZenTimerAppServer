import HabitCategory from "../../models/habitCategory.js";
import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import { logError, logInfo } from "../../util/logging.js";

export const deleteAllCategories = async (req, res) => {
  const userId = req.userId;

  try {
    if (!userId) {
      logError("User ID not found in request.");
      return res.status(400).json({
        success: false,
        msg: "User ID is required.",
      });
    }

    logInfo(`Deleting all categories for user ID: ${userId}`);

    const categories = await HabitCategory.find({ createdBy: userId });
    logInfo(`Fetched categories for user ID: ${userId}`);

    if (categories.length === 0) {
      logInfo(`No categories found for user ID: ${userId}`);
      return res.status(404).json({
        success: false,
        msg: `No categories found for the user.`,
      });
    }

    const categoryIds = categories.map((category) => category._id);
    logInfo(
      `Found ${categoryIds.length} categories to delete for user ID: ${userId}`
    );

    await DailyTimeRecord.deleteMany({ categoryId: { $in: categoryIds } });
    logInfo(`Associated daily records deleted for categories: ${categoryIds}`);

    await HabitCategory.deleteMany({ createdBy: userId });
    logInfo(`Categories deleted for user ID: ${userId}`);

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
