import mongoose from "mongoose";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";

const recordSchema = new mongoose.Schema({
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
    default: Date.now,
    required: true,
  },
  totalDailyMinutes: {
    type: Number,
    required: true,
    default: 0,
  },
});

export const validateRecords = (recordObject) => {
  const errorList = [];
  const allowedFields = ["minutesUpdate", "categoryId", "userId", "date"];

  const validatedKeysMessage = validateAllowedFields(
    recordObject,
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
    recordObject.minutesUpdate === undefined ||
    recordObject.minutesUpdate === null
  ) {
    errorList.push("minutesUpdate is required.");
  } else if (typeof recordObject.minutesUpdate !== "number") {
    errorList.push("minutesUpdate must be a number.");
  } else if (
    recordObject.minutesUpdate < 0 ||
    recordObject.minutesUpdate > 1440
  ) {
    errorList.push(
      "minutesUpdate must be between 0 and 1440 (24 hours in minutes)."
    );
  }

  // Validate 'categoryId': must be a valid ObjectId (MongoDB's unique identifier)
  if (
    recordObject.categoryId &&
    !mongoose.Types.ObjectId.isValid(recordObject.categoryId)
  ) {
    errorList.push("categoryId must be a valid ObjectId.");
  }

  // Validate 'userId': must be a valid ObjectId (MongoDB's unique identifier)
  if (
    recordObject.userId &&
    !mongoose.Types.ObjectId.isValid(recordObject.userId)
  ) {
    errorList.push("userId must be a valid ObjectId.");
  }

  // If 'date' is provided, check if it's valid
  if (recordObject.date && isNaN(Date.parse(recordObject.date))) {
    errorList.push("Date must be in a valid ISO format.");
  }

  if (errorList.length > 0) {
    logInfo("Daily record validation failed: " + errorList.join(", "));
  } else {
    // logInfo("Daily record validation passed without errors.");
  }

  return errorList;
};

const DailyTimeRecord = mongoose.model("DailyTimeRecord", recordSchema);
export default DailyTimeRecord;
