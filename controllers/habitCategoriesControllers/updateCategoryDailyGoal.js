import mongoose from "mongoose";
import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import { logError } from "../../util/logging.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

export const updateCategoryDailyGoal = async (req, res) => {
  const { categoryId } = req.params;
  const { dailyGoal: newDailyGoal } = req.body;
  const createdBy = req.userId;
  const allowedFields = ["dailyGoal"];

  // Validate the category ID
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "BAD REQUEST: Invalid category ID.",
    });
  }

  // Validate that dailyGoal is provided
  if (
    newDailyGoal === undefined ||
    newDailyGoal === null ||
    newDailyGoal === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "BAD REQUEST: dailyGoal is required.",
    });
  }

  // Validate allowed fields
  const invalidFieldsError = validateAllowedFields(req.body, allowedFields);
  if (invalidFieldsError) {
    return res.status(400).json({
      success: false,
      message: `BAD REQUEST: ${invalidFieldsError}`,
    });
  }

  try {
    const category = await HabitCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Verify if the user is authorized to update the category
    if (category.createdBy.toString() !== createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update this category.",
      });
    }

    // Validate the new dailyGoal
    const errorList = validateCategory({
      name: category.name,
      dailyGoal: newDailyGoal,
    });
    if (errorList.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrorMessage(errorList),
      });
    }

    // Update the dailyGoal
    category.dailyGoal = newDailyGoal;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category daily goal updated successfully.",
      category,
    });
  } catch (error) {
    logError(`Error updating category daily goal: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Error updating category daily goal.",
      error: validationErrorMessage([error.message]),
    });
  }
};
