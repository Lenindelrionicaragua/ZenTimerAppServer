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
  totalMinutes: {
    type: Number,
    default: 0,
    required: true,
    min: 0,
    max: 1440, // Optional: you can set this in the schema to enforce the limit
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
  requireCreatedBy = true,
  requireTotalMinutes = true,
  requireCreatedAt = true
) => {
  const errorList = [];
  const allowedKeys = ["name", "createdBy", "totalMinutes", "createdAt"];

  logInfo("Starting validation for category object:", categoryObject);

  // Validate allowed fields
  const validatedKeysMessage = validateAllowedFields(
    categoryObject,
    allowedKeys
  );
  if (validatedKeysMessage.length > 0) {
    errorList.push(validatedKeysMessage);
    logInfo("Validation failed for allowed fields: ", validatedKeysMessage);
  }

  // Validate name
  if (requireName) {
    if (!categoryObject.name || typeof categoryObject.name !== "string") {
      errorList.push("Category name is required.");
    } else if (!/^[A-Za-z\s\-!]{1,15}$/.test(categoryObject.name)) {
      errorList.push(
        "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
      );
    }
  }

  // Validate createdBy
  if (requireCreatedBy && !categoryObject.createdBy) {
    errorList.push("Creator is required.");
  }

  // Validate total minutes
  if (requireTotalMinutes) {
    if (
      categoryObject.totalMinutes == null ||
      typeof categoryObject.totalMinutes !== "number"
    ) {
      errorList.push("Total minutes is required.");
    } else if (categoryObject.totalMinutes < 0) {
      errorList.push("Total minutes cannot be negative.");
    } else if (categoryObject.totalMinutes > 1440) {
      errorList.push("Total minutes cannot exceed 1440 minutes (24 hours).");
    }
  }

  // Validate createdAt
  if (requireCreatedAt && !categoryObject.createdAt) {
    errorList.push("Creation date is required.");
  }

  // Log and return errors if any
  if (errorList.length > 0) {
    logInfo("Category validation failed: " + errorList.join(", "));
  } else {
    logInfo("Category validation passed without errors.");
  }

  return errorList;
};

const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);

export default HabitCategory;
