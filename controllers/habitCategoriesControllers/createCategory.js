import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import { logError, logInfo } from "../../util/logging.js";

export const createCategory = async (req, res) => {
  const allowedFields = ["name", "createdBy", "createdAt"];

  // Check if the habitCategory object is valid
  if (!(req.body.habitCategory instanceof Object)) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: You need to provide a valid 'habitCategory' object. Received: ${JSON.stringify(
        req.body.habitCategory
      )}`,
    });
  }

  // Validate allowed fields for the habitCategory object
  const invalidFieldsError = validateAllowedFields(
    req.body.habitCategory,
    allowedFields
  );
  if (invalidFieldsError) {
    return res
      .status(400)
      .json({ success: false, msg: `Invalid request: ${invalidFieldsError}` });
  }

  try {
    // Validate the habitCategory details
    const errorList = validateCategory(req.body.habitCategory);
    if (errorList.length > 0) {
      return res
        .status(400)
        .json({ success: false, msg: validationErrorMessage(errorList) });
    }

    // Check if a category with the same name already exists for the user
    const existingCategory = await HabitCategory.findOne({
      name: req.body.habitCategory.name,
      createdBy: req.body.habitCategory.createdBy,
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, msg: "Category already exists." });
    }

    // Create a new HabitCategory instance
    const newCategory = new HabitCategory({
      name: req.body.habitCategory.name,
      createdBy: req.body.habitCategory.createdBy,
      createdAt: req.body.habitCategory.createdAt || Date.now(), // Default to now if not provided
    });

    // Save the new category to the database
    await newCategory.save();

    // Respond with success message and the created category details
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory,
    });
    logInfo(`"New Category created:", ${newCategory}`);
  } catch (error) {
    // Log and respond with an error if category creation fails
    logError("Error creating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating category.", error });
  }
};
