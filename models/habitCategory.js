import mongoose from "mongoose";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";

// Define the habit category schema
const habitCategorySchema = new mongoose.Schema({
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
});

// Validation function for the category
export const validateCategory = (
  categoryObject,
  requireName = true,
  requireCreatedAt = false
) => {
  const errorList = [];
  const allowedKeys = ["name", "createdBy", "createdAt"];

  logInfo("Starting validation for category object:", categoryObject);

  // 1. Validate allowed fields
  const validatedKeysMessage = validateAllowedFields(
    categoryObject,
    allowedKeys
  );
  if (validatedKeysMessage.length > 0) {
    errorList.push(validatedKeysMessage);
    logInfo("Validation failed for allowed fields: ", validatedKeysMessage);
  }

  // 2. Validate 'name'
  if (requireName) {
    if (!categoryObject.name || typeof categoryObject.name !== "string") {
      errorList.push("Category name is required.");
    } else if (!/^[a-zA-Z0-9\s\-\!]{1,15}$/.test(categoryObject.name)) {
      errorList.push(
        "Category name must contain only letters, numbers, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
      );
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
