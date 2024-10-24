import DailyTimeRecord from "../../models/dailyTimeRecord.js";
import { validateDailyRecords } from "../../models/dailyTimeRecord.js";
import { logError, logInfo } from "../../util/logging.js";
import { calculateCategoryPercentages } from "../../util/calculations.js";

export const createDailyTimeRecords = async (req, res) => {
  const { minutesUpdate, date } = req.body;
  const { categoryId } = req.params;
  const userId = req.userId;

  // logInfo(
  //   `Received request to create/update daily record: userId=${userId}, categoryId=${categoryId}, minutesUpdate=${minutesUpdate}, date=${date}`
  // );

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
    // logInfo(
    //   `Validation passed for user ${userId} and category ${categoryId}. Checking for existing record.`
    // );

    // Check for an existing record with the normalized date
    const existingRecord = await DailyTimeRecord.findOne({
      userId,
      categoryId,
      date,
    });

    if (existingRecord) {
      // logInfo(
      //   `Existing record found for user ${userId} and category ${categoryId}. Updating the record.`
      // );
      existingRecord.totalDailyMinutes += minutesUpdate; // Add minutes to existing record
      await existingRecord.save();

      // logInfo(
      //   `Updated daily record for user ${userId} and category ${categoryId}. Total minutes: ${existingRecord.totalDailyMinutes}`
      // );
      return res.status(200).json({ success: true, record: existingRecord });
    }

    // logInfo(
    //   `No existing record found for user ${userId} and category ${categoryId}. Creating a new record.`
    // );

    // If no existing record, create a new one
    const newRecord = new DailyTimeRecord({
      userId,
      categoryId,
      date: date || Date.now(),
      totalDailyMinutes: minutesUpdate,
    });

    await newRecord.save();

    // logInfo(
    //   `Created new daily record for user ${userId} and category ${categoryId}. Total minutes: ${newRecord.totalDailyMinutes}`
    // );
    return res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    logError("Error creating or updating daily record: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Error saving record.", error });
  }
};
