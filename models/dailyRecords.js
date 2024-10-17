import mongoose from "mongoose";
import validateAllowedFields from "../util/validateAllowedFields.js";
import { logInfo } from "../util/logging.js";
import moment from "moment";

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
    type: String,
    required: true,
  },
  totalDailyMinutes: {
    type: Number,
    required: true,
    default: 0,
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

  // If 'date' is provided, check if it's valid
  if (dailyRecordObject.date) {
    if (!moment(dailyRecordObject.date, "YYYY-MM-DD", true).isValid()) {
      errorList.push("Date must be in a valid ISO format (YYYY-MM-DD).");
    }
  }

  if (errorList.length > 0) {
    logInfo("Daily record validation failed: " + errorList.join(", "));
  } else {
    logInfo("Daily record validation passed without errors.");
  }

  return errorList;
};

const DailyRecord = mongoose.model("DailyRecord", dailyRecordSchema);
export default DailyRecord;
