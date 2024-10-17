import { validateDailyRecords } from "../../models/dailyRecords.js";
import { logError, logInfo } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js"; // Ensure this is the correct model

export const createAndUpdateDailyRecord = async (req, res) => {
  const { minutesUpdate, date } = req.body;
  const { categoryId } = req.params;
  const userId = req.userId;

  logInfo(
    `Received request to create/update daily record: userId=${userId}, categoryId=${categoryId}, minutesUpdate=${minutesUpdate}, date=${date}`
  );

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
    logInfo(
      `Validation passed for user ${userId} and category ${categoryId}. Checking for existing record.`
    );

    // Normalize the date (YYYY-MM-DD format)
    const normalizedDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    // Check for an existing record
    const existingRecord = await DailyRecord.findOne({
      userId,
      categoryId,
      date: normalizedDate,
    });

    if (existingRecord) {
      logInfo(
        `Existing record found for user ${userId} and category ${categoryId}. Updating the record.`
      );
      existingRecord.totalDailyMinutes += minutesUpdate; // Add minutes to existing record
      await existingRecord.save();

      logInfo(
        `Updated daily record for user ${userId} and category ${categoryId}. Total minutes: ${existingRecord.totalDailyMinutes}`
      );
      return res.status(200).json({ success: true, record: existingRecord });
    }

    logInfo(
      `No existing record found for user ${userId} and category ${categoryId}. Creating a new record.`
    );
    const newRecord = new DailyRecord({
      userId,
      categoryId,
      totalDailyMinutes: minutesUpdate, // Initial minutes
      date: normalizedDate, // Use normalized date
    });

    await newRecord.save();

    logInfo(
      `Created new daily record for user ${userId} and category ${categoryId}. Total minutes: ${newRecord.totalDailyMinutes}`
    );
    return res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    logError("Error creating or updating daily record: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Error saving record.", error });
  }
};
