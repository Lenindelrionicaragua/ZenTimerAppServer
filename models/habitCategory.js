import mongoose from "mongoose";
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
export const validateCategory = (categoryObject) => {
  const errorList = [];

  // Validate name
  if (!categoryObject.name || typeof categoryObject.name !== "string") {
    errorList.push("Category name is required.");
    logInfo("Category validation failed: Name is required.");
  } else if (!/^[A-Za-z\s\-!]{1,10}$/.test(categoryObject.name)) {
    // Updated regex
    errorList.push(
      "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 10 characters."
    );
    logInfo("Category validation failed: Invalid category name.");
  }

  // Validate createdBy
  if (!categoryObject.createdBy) {
    errorList.push("Creator is required.");
    logInfo("Category validation failed: Creator is required.");
  }

  // Validate total minutes
  if (
    categoryObject.totalMinutes == null ||
    typeof categoryObject.totalMinutes !== "number"
  ) {
    errorList.push("Total minutes is required.");
    logInfo("Category validation failed: Total minutes are required.");
  } else if (categoryObject.totalMinutes < 0) {
    errorList.push("Total minutes cannot be negative.");
    logInfo("Category validation failed: Total minutes cannot be negative.");
  } else if (categoryObject.totalMinutes > 1440) {
    errorList.push("Total minutes cannot exceed 1440 minutes (24 hours).");
    logInfo("Category validation failed: Invalid total minutes.");
  }

  // Validate createdAt
  if (!categoryObject.createdAt) {
    errorList.push("Creation date is required.");
    logInfo("Category validation failed: Creation date is required.");
  }

  return errorList;
};

const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);

export default HabitCategory;
