import HabitCategory from "../../models/habitCategory.js";
import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import { logError, logInfo } from "../../util/logging.js";

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;
  const userId = req.userId;

  try {
    // Find the category by its ID
    const category = await HabitCategory.findOne({
      _id: categoryId,
      createdBy: userId, // Make sure the category belongs to the user
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        msg: `The category you are trying to delete does not exist.`,
      });
    }

    // Find and delete all daily records associated with the category
    const dailyTimeRecord = await DailyTimeRecord.find({
      categoryId: categoryId,
    });

    if (dailyTimeRecord.length > 0) {
      // Delete all daily records first
      await DailyTimeRecord.deleteMany({ categoryId: categoryId });
    }

    // Now delete the category itself
    await category.remove();

    // Return success response
    return res.status(200).json({
      success: true,
      msg: `The category and all its associated records have been deleted.`,
    });
  } catch (error) {
    logError("Error deleting category:", error);
    return res.status(500).json({
      success: false,
      msg: "An error occurred while deleting the category.",
      error: error.message,
    });
  }
};
