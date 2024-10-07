import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import { logError, logInfo } from "../../util/logging.js";

export const updateCategoryTime = async (req, res) => {
  const { categoryId } = req.params;
  const { totalMinutes } = req.body;

  const allowedKeys = ["totalMinutes"];

  // Validate incoming request body against allowed keys
  const validatedKeysMessage = validateAllowedFields(req.body, allowedKeys);
  if (validatedKeysMessage.length > 0) {
    logInfo(`Validation failed: ${validatedKeysMessage}`);
    return res
      .status(400)
      .json({ message: validationErrorMessage(validatedKeysMessage) });
  }

  // Validate the overall category object for required fields
  const errorList = validateCategory(req.body, false, false, true, false);
  if (errorList.length > 0) {
    logInfo(`Validation failed: ${errorList}`);
    return res.status(400).json({ message: validationErrorMessage(errorList) });
  }

  // Check if totalMinutes is valid (not negative and finite)
  if (totalMinutes < 0) {
    logInfo("Total minutes cannot be negative.");
    return res
      .status(400)
      .json({ message: "Total minutes cannot be negative." });
  } else if (!Number.isFinite(totalMinutes)) {
    logInfo("Total minutes must be a finite number.");
    return res
      .status(400)
      .json({ message: "Total minutes must be a finite number." });
  }

  try {
    // Attempt to find the category by ID
    logInfo(`Searching for category with ID: ${categoryId}`);
    const category = await HabitCategory.findById(categoryId);

    if (!category) {
      logInfo(`Category not found: ${categoryId}`);
      return res.status(404).json({ message: "Category not found." });
    }

    logInfo(
      `Updating category ${categoryId} with total minutes: ${totalMinutes}.`
    );

    category.totalMinutes += totalMinutes;

    await category.save();
    logInfo(`Category ${categoryId} updated successfully.`);

    res
      .status(200)
      .json({ message: "Category updated successfully.", category });
  } catch (error) {
    logInfo(`Error updating category time: ${error}`);
    res.status(500).json({ message: "Error updating category time.", error });
  }
};
