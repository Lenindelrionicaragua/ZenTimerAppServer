// /util/autoCreateDefaultCategories.js
import HabitCategory, { validateCategory } from "../models/habitCategory.js";
import { logError, logInfo } from "../util/logging.js";
import validationErrorMessage from "../util/validationErrorMessage.js";

export const autoCreateDefaultCategories = async (userId) => {
  // Define default categories
  const defaultCategories = [
    { name: "Work" },
    { name: "Family time" },
    { name: "Exercise" },
    { name: "Screen-free" },
    { name: "Rest" },
    { name: "Study" },
  ];

  try {
    for (const categoryData of defaultCategories) {
      // Construct habit category with user ID and creation time
      const habitCategory = {
        ...categoryData,
        createdBy: userId,
        createdAt: Date.now(),
        dailyGoal: 0, // Default daily goal
      };

      // Validate category data
      const errorList = validateCategory(habitCategory);
      if (errorList.length > 0) {
        logInfo(
          `Validation failed for category ${
            categoryData.name
          }: ${validationErrorMessage(errorList)}`
        );
        continue; // Skip category if validation fails
      }

      // Check if category already exists for this user
      const existingCategory = await HabitCategory.findOne({
        name: categoryData.name,
        createdBy: userId,
      }).collation({ locale: "en", strength: 1 });

      // Skip creation if category exists
      if (existingCategory) {
        logInfo(
          `Category "${categoryData.name}" already exists for user ${userId}`
        );
        continue;
      }

      // Create and save the new category
      const newCategory = new HabitCategory(habitCategory);
      await newCategory.save();
      logInfo(
        `Default category "${categoryData.name}" created for user ${userId}`
      );
    }
  } catch (error) {
    // Log any error encountered during category creation
    logError("Error creating default categories:", error);
  }
};
