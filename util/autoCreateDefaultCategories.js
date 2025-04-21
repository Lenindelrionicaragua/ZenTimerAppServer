import HabitCategory, { validateCategory } from "../models/habitCategory.js";
import validationErrorMessage from "../util/validationErrorMessage.js";
import mongoose from "mongoose";
import { logError } from "../util/logging.js";
// import { logInfo } from "../util/logging.js";

export const autoCreateDefaultCategories = async (userId) => {
  const defaultCategories = [
    { name: "Work" },
    { name: "Family time" },
    { name: "Exercise" },
    { name: "Screen-free" },
    { name: "Rest" },
    { name: "Study" },
  ];

  try {
    const existingCategories = await HabitCategory.find({
      createdBy: userId,
    }).collation({ locale: "en", strength: 1 });

    const existingCategoryNames = existingCategories.map(
      (category) => category.name,
    );

    for (const categoryData of defaultCategories) {
      if (existingCategoryNames.includes(categoryData.name)) {
        // logInfo(
        //   `Category "${categoryData.name}" already exists for user ${userId}`,
        // );
        continue;
      }

      const habitCategory = {
        ...categoryData,
        createdBy: userId,
        createdAt: new Date(),
        categoryId: new mongoose.Types.ObjectId(),
        dailyGoal: 60,
      };

      const errorList = validateCategory(habitCategory);
      if (errorList.length > 0) {
        logError(
          `Validation failed for category ${
            categoryData.name
          }: ${validationErrorMessage(errorList)}`,
        );
        continue;
      }

      const newCategory = new HabitCategory(habitCategory);
      await newCategory.save();
      // logInfo(
      //   `Default category "${categoryData.name}" created for user ${userId}`,
      // );
    }
  } catch (error) {
    logError("Error creating default categories for user " + userId, error);
  }
};
