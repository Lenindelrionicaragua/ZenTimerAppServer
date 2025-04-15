import mongoose from "mongoose";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";

// Define the habit category schema
const habitCategorySchema = new mongoose.Schema({
  categoryId: {
    // Agregar el campo categoryId
    type: mongoose.Schema.Types.ObjectId,
    unique: true, // Asegurando que categoryId sea único
    required: true,
    default: () => new mongoose.Types.ObjectId(), // Generar automáticamente si no se proporciona
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dailyGoal: {
    type: Number,
    default: 55,
    min: [15, "Daily goal must be at least 15 minutes."],
    max: [1440, "Daily goal cannot exceed 1440 minutes (24 hours)."],
  },
});

// Validation function for the category
export const validateCategory = (categoryObject, requireName = true) => {
  const errorList = [];
  const allowedKeys = [
    "categoryId", // Asegúrate de que categoryId esté en la lista de campos permitidos
    "name",
    "createdBy",
    "createdAt",
    "dailyGoal",
  ];

  // Validate allowed fields
  const validatedKeysMessage = validateAllowedFields(
    categoryObject,
    allowedKeys,
  );
  if (validatedKeysMessage.length > 0) {
    errorList.push(validatedKeysMessage);
    logInfo("Validation failed for allowed fields: ", validatedKeysMessage);
  }

  // Validate 'name' field
  if (requireName) {
    if (!categoryObject.name || typeof categoryObject.name !== "string") {
      errorList.push("Category name is required.");
    } else if (!/^[a-zA-Z0-9\s\-\!]{1,15}$/.test(categoryObject.name)) {
      errorList.push(
        "Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters.",
      );
    }
  }

  // Validate 'categoryId' as an ObjectId (if exists)
  if (
    categoryObject.categoryId &&
    !mongoose.Types.ObjectId.isValid(categoryObject.categoryId)
  ) {
    errorList.push("Invalid 'categoryId' provided.");
  }

  // Validate 'createdBy' as an ObjectId
  if (
    categoryObject.createdBy &&
    !mongoose.Types.ObjectId.isValid(categoryObject.createdBy)
  ) {
    errorList.push("Invalid 'createdBy' ObjectId.");
  }

  // Validate 'createdAt' as a valid date (if exists)
  if (categoryObject.createdAt && isNaN(Date.parse(categoryObject.createdAt))) {
    errorList.push("Invalid 'createdAt' date provided.");
  }

  // Validate 'dailyGoal' range
  if (categoryObject.dailyGoal !== undefined) {
    if (
      typeof categoryObject.dailyGoal !== "number" ||
      !Number.isInteger(categoryObject.dailyGoal)
    ) {
      errorList.push("Daily goal must be an integer.");
    } else if (categoryObject.dailyGoal < 15) {
      errorList.push("Daily goal must be at least 15 minutes.");
    } else if (categoryObject.dailyGoal > 1440) {
      errorList.push("Daily goal cannot exceed 1440 minutes (24 hours).");
    }
  }

  // Log validation results
  if (errorList.length > 0) {
    logInfo("Category validation failed: " + errorList.join(", "));
  } else {
    logInfo("Category validation passed without errors.");
  }

  return errorList;
};

// Create and export the HabitCategory model
const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);
export default HabitCategory;
