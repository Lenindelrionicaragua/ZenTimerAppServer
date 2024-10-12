import mongoose from "mongoose";
import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import { logError, logInfo } from "../../util/logging.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

// Controller to update the name of a habit category
export const updateCategoryName = async (req, res) => {
  const { categoryId } = req.params; // Extract categoryId from URL parameters
  const { name: newName } = req.body; // Extract the new name from the request body
  const createdBy = req.userId; // Extract createdBy from the authenticated user's ID

  const allowedFields = ["name"]; // Define allowed fields for the update

  // Validate the category ID
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    logInfo(`Invalid category ID: ${categoryId}`); // Log invalid category ID
    return res
      .status(400)
      .json({ message: "BAD REQUEST: Invalid category ID." });
  }

  // Validate allowed fields in the request body
  const invalidFieldsError = validateAllowedFields(req.body, allowedFields);
  if (invalidFieldsError) {
    logInfo(`Invalid fields in request body: ${invalidFieldsError}`); // Log invalid fields error
    return res.status(400).json({
      message: `BAD REQUEST: ${invalidFieldsError}`,
    });
  }

  try {
    logInfo(`Searching for category with ID: ${categoryId}`); // Log the search for the category
    const category = await HabitCategory.findById(categoryId); // Find the category by ID

    // Check if the category exists
    if (!category) {
      logInfo(`Category not found: ${categoryId}`); // Log category not found
      return res.status(404).json({ message: "Category not found." });
    }

    // Debugging: Log the creator of the category and the incoming userId
    logInfo(
      `Category createdBy: ${category.createdBy}, Incoming createdBy: ${createdBy}`
    );

    // Verify that the creator of the category matches the provided userId
    if (category.createdBy.toString() !== createdBy.toString()) {
      logInfo(`User not authorized to update category: ${createdBy}`); // Log unauthorized access
      return res.status(403).json({
        message: "Forbidden: You are not authorized to update this category.",
      });
    }

    // Validate the new category name (only need to check name)
    const errorList = validateCategory({ name: newName });
    if (errorList.length > 0) {
      logInfo(`Validation failed for new name: ${errorList.join(", ")}`); // Log validation errors
      return res
        .status(400)
        .json({ message: validationErrorMessage(errorList) });
    }

    // Check if the new name is the same as the current name
    if (category.name === newName) {
      logInfo(`The new name is the same as the current name.`); // Log if names are the same
      return res.status(400).json({
        message: "The new name must be different from the current name.",
      });
    }

    // Update the category name
    category.name = newName;
    await category.save(); // Save the updated category

    logInfo(
      `Category ${categoryId} updated successfully with new name: ${newName}`
    ); // Log successful update
    return res
      .status(200)
      .json({ message: "Category name updated successfully.", category });
  } catch (error) {
    logError(`Error updating category name: ${error}`); // Log error during update
    return res.status(500).json({
      message: "Error updating category name.",
      error: validationErrorMessage([error.message]), // Return the error message
    });
  }
};
