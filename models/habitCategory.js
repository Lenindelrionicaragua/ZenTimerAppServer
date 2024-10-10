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
  dailyRecords: [
    {
      date: {
        type: Date,
        required: true,
      },
      minutes: {
        type: Number,
        default: 0,
        min: 0,
        max: 1440, // Minutes for a specific day cannot exceed 24 hours
      },
    },
  ],
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
  requireCreatedAt = true
) => {
  const errorList = [];
  const allowedKeys = ["name", "createdBy", "dailyRecords", "createdAt"];

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
    } else if (!/^[a-zA-Z0-9\s\-\!]{1,15}$/.test(categoryObject.name)) {
      errorList.push(
        "Category name must contain only letters, spaces, hyphens, or exclamation marks, and have a maximum length of 15 characters."
      );
    }
  }

  // Validate createdBy
  if (requireCreatedBy && !categoryObject.createdBy) {
    errorList.push("Creator is required.");
  }

  // Validate daily records (individual day entries)
  if (categoryObject.dailyRecords) {
    categoryObject.dailyRecords.forEach((record) => {
      if (!record.date) {
        errorList.push("Each daily record must have a valid date.");
      }
      if (record.minutes < 0) {
        errorList.push("Minutes for a daily record cannot be negative.");
      } else if (record.minutes > 1440) {
        errorList.push(
          "Minutes for a daily record cannot exceed 1440 minutes (24 hours)."
        );
      }
    });
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

// Calculating the total minutes for a given range (day, week, month, year)
habitCategorySchema.methods.calculateTotalMinutes = function (
  startDate,
  endDate
) {
  let totalMinutes = 0;

  this.dailyRecords.forEach((record) => {
    if (record.date >= startDate && record.date <= endDate) {
      totalMinutes += record.minutes;
    }
  });

  return totalMinutes;
};

const HabitCategory = mongoose.model("HabitCategory", habitCategorySchema);

export default HabitCategory;
