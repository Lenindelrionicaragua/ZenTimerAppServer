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
  } else {
    logInfo("Allowed fields validation passed.");
  }

  // Validate name
  if (
    requireName &&
    (!categoryObject.name || typeof categoryObject.name !== "string")
  ) {
    errorList.push("Category name is required.");
    logInfo(
      "Validation failed for name: Category name is required or invalid."
    );
  } else if (
    requireName &&
    !/^[A-Za-z\s\-!]{1,10}$/.test(categoryObject.name)
  ) {
    errorList.push(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 10 characters."
    );
    logInfo("Validation failed for name: Invalid format or length.");
  } else {
    logInfo("Category name validation passed.");
  }

  // Validate createdBy
  if (requireCreatedBy && !categoryObject.createdBy) {
    errorList.push("Creator is required.");
    logInfo("Validation failed for createdBy: Creator is required.");
  } else {
    logInfo("createdBy validation passed.");
  }

  // Validate total minutes
  if (
    requireTotalMinutes &&
    (categoryObject.totalMinutes == null ||
      typeof categoryObject.totalMinutes !== "number")
  ) {
    errorList.push("Total minutes is required.");
    logInfo(
      "Validation failed for totalMinutes: Required field or invalid type."
    );
  } else if (requireTotalMinutes && categoryObject.totalMinutes < 0) {
    errorList.push("Total minutes cannot be negative.");
    logInfo("Validation failed for totalMinutes: Negative value.");
  } else if (requireTotalMinutes && categoryObject.totalMinutes > 1440) {
    errorList.push("Total minutes cannot exceed 1440 minutes (24 hours).");
    logInfo("Validation failed for totalMinutes: Value exceeds 1440 minutes.");
  } else {
    logInfo("totalMinutes validation passed.");
  }

  // Validate createdAt
  if (requireCreatedAt && !categoryObject.createdAt) {
    errorList.push("Creation date is required.");
    logInfo("Validation failed for createdAt: Creation date is required.");
  } else {
    logInfo("createdAt validation passed.");
  }

  // If there are validation errors, log them
  if (errorList.length > 0) {
    logInfo("Category validation failed: " + errorList.join(", "));
  } else {
    logInfo("Category validation passed without errors.");
  }

  return errorList;
};

const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);

export default HabitCategory;
