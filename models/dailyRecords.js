import mongoose from "mongoose";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";

const dailyRecordSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HabitCategory",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now, // If no date is provided, use the current date
    required: true,
  },
  timeSpentInMinutes: {
    type: Number,
    required: true,
    default: 0, // Default to 0 if no time is provided
  },
});

export const validateDailyRecords = (dailyRecordObject) => {
  const errorList = [];
  const allowedFields = ["minutesUpdate", "categoryId", "userId", "date"];

  const validatedKeysMessage = validateAllowedFields(
    dailyRecordObject,
    allowedFields
  );

  if (validatedKeysMessage.length > 0) {
    errorList.push(validatedKeysMessage);
    logInfo(
      "Validation failed for allowed fields in daily record: ",
      validatedKeysMessage
    );
  }

  // Validate 'minutesUpdate': required, must be a number, and between 0 and 1440 minutes
  if (
    dailyRecordObject.minutesUpdate === undefined ||
    dailyRecordObject.minutesUpdate === null
  ) {
    errorList.push("minutesUpdate is required.");
  } else if (typeof dailyRecordObject.minutesUpdate !== "number") {
    errorList.push("minutesUpdate must be a number.");
  } else if (
    dailyRecordObject.minutesUpdate < 0 ||
    dailyRecordObject.minutesUpdate > 1440
  ) {
    errorList.push(
      "minutesUpdate must be between 0 and 1440 (24 hours in minutes)."
    );
  }

  // Validate 'categoryId': must be a valid ObjectId (MongoDB's unique identifier)
  if (
    dailyRecordObject.categoryId &&
    !mongoose.Types.ObjectId.isValid(dailyRecordObject.categoryId)
  ) {
    errorList.push("categoryId must be a valid ObjectId.");
  }

  // Validate 'userId': must be a valid ObjectId (MongoDB's unique identifier)
  if (
    dailyRecordObject.userId &&
    !mongoose.Types.ObjectId.isValid(dailyRecordObject.userId)
  ) {
    errorList.push("userId must be a valid ObjectId.");
  }

  // Validate 'date': optional, but if provided, it must be a valid date format
  if (dailyRecordObject.date && isNaN(Date.parse(dailyRecordObject.date))) {
    errorList.push("Invalid date format.");
  }

  // Log validation results for debugging and monitoring purposes
  if (errorList.length > 0) {
    logInfo("Daily record validation failed: " + errorList.join(", "));
  } else {
    logInfo("Daily record validation passed without errors.");
  }

  // Return the list of validation errors (if any)
  return errorList;
};

const DailyRecord = mongoose.model("DailyRecord", dailyRecordSchema);
export default DailyRecord;
