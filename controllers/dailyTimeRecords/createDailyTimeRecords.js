import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import { validateDailyRecords } from "../../models/dailyTimeRecord.js";
import { logError, logInfo } from "../../util/logging.js";
import { calculateCategoryPercentages } from "../../util/calculations.js";

export const createDailyTimeRecords = async (req, res) => {
  const { minutesUpdate, date } = req.body;
  const { categoryId } = req.params;
  const userId = req.userId;

  // Validate input
  const errorList = validateDailyRecords({
    userId,
    categoryId,
    minutesUpdate,
    date,
  });

  if (errorList.length > 0) {
    logInfo(
      `Validation failed for user ${userId} and category ${categoryId}. Errors: ${JSON.stringify(
        errorList
      )}`
    );
    return res.status(400).json({ success: false, errors: errorList });
  }

  try {
    // Check for an existing record with the normalized date
    const existingRecord = await DailyTimeRecord.findOne({
      userId,
      categoryId,
      date,
    });

    if (existingRecord) {
      existingRecord.totalDailyMinutes += minutesUpdate; // Add minutes to existing record
      await existingRecord.save();

      return res.status(200).json({ success: true, record: existingRecord });
    }

    // If no existing record, create a new one
    const newRecord = new DailyTimeRecord({
      userId,
      categoryId,
      date: date || Date.now(),
      totalDailyMinutes: minutesUpdate,
    });

    await newRecord.save();

    return res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    logError("Error creating or updating daily record: ", error);
    return res
      .status(500)
      .json({ success: false, msg: "Error saving record.", error });
  }
};
