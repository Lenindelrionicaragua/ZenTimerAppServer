import mongoose from "mongoose";
import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import { logError } from "../../util/logging.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

export const updateCategoryName = async (req, res) => {
  const { categoryId } = req.params;
  const { name: newName } = req.body;
  const createdBy = req.userId;
  const allowedFields = ["name"];

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "BAD REQUEST: Invalid category ID.",
    });
  }

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

    // Verifying if the user is authorized to update the category
    if (category.createdBy.toString() !== createdBy.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update this category.",
      });
    }

    // Validating the new name
    const errorList = validateCategory({ name: newName });
    if (errorList.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrorMessage(errorList),
      });
    }

    // Updating the category name
    category.name = newName;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category name updated successfully.",
      category,
    });
  } catch (error) {
    logError(`Error updating category name: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Error updating category name.",
      error: validationErrorMessage([error.message]),
    });
  }
};
