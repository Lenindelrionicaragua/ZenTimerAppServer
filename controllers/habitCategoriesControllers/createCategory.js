import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import { logError, logInfo } from "../../util/logging.js";

export const createCategory = async (req, res) => {
  // Define the allowed fields for the habitCategory object in the request body
  const allowedFields = ["name"];

  // Extract habitCategory data from the request body
  const { habitCategory } = req.body;

  // Extract userId from authenticated user and createdAt if present in request
  const userId = req.userId;
  const createdAt = habitCategory.createdAt;

  // Validate that habitCategory is an object
  if (!(habitCategory instanceof Object)) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: You need to provide a valid 'habitCategory' object. Received: ${JSON.stringify(
        habitCategory
      )}`,
    });
  }

  // Validate allowed fields in the habitCategory object
  const invalidFieldsError = validateAllowedFields(
    habitCategory,
    allowedFields
  );
  if (invalidFieldsError) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: ${invalidFieldsError}`,
    });
  }

  try {
    // Validate the structure of the habitCategory
    const errorList = validateCategory(habitCategory, true, false);
    if (errorList.length > 0) {
      return res.status(400).json({
        success: false,
        msg: validationErrorMessage(errorList),
      });
    }

    // Check if a category with the same name already exists for the user
    const existingCategory = await HabitCategory.findOne({
      name: habitCategory.name,
      createdBy: userId, // User ID from authentication
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        msg: "Category already exists.",
      });
    }

    // If createdAt is not provided, use the current timestamp
    const finalCreatedAt = createdAt || Date.now();

    // Create a new habit category instance
    const newCategory = new HabitCategory({
      name: habitCategory.name,
      createdBy: userId, // Associate the new category with the authenticated user
      createdAt: finalCreatedAt, // Use the provided or current timestamp
    });

    // Save the new category to the database
    await newCategory.save();

    // Respond with success and the created category
    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory,
    });
    logInfo(`New Category created: ${JSON.stringify(newCategory)}`);
  } catch (error) {
    // Handle any errors during the creation process
    logError("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category.",
      error,
    });
  }
};
