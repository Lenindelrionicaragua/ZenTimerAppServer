import { validateDailyRecords } from "../../models/dailyRecords.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import { logError, logInfo } from "../../util/logging.js";
import DailyRecord from "../../models/dailyRecords.js"; // Ensure this is the correct model

export const createAndUpdateDailyRecord = async (req, res) => {
  const { minutesUpdate, date } = req.body;
  const { userId, categoryId } = req.params; // Extract userId and categoryId from params

  //   const responseDebugging = req.params;
  //   logInfo(`Received request params: ${JSON.stringify(responseDebugging)}`);

  // Log incoming request data for debugging
  logInfo(
    `Received request to create/update daily record: userId=${userId}, categoryId=${categoryId}, minutesUpdate=${minutesUpdate}, date=${date}`
  );

  // Validate the request body using validateDailyRecords
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
    // Log that the validation passed and we are proceeding with the record check
    logInfo(
      `Validation passed for user ${userId} and category ${categoryId}. Checking for existing record.`
    );

    const normalizedDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const existingRecord = await DailyRecord.findOne({
      userId,
      categoryId,
      date: normalizedDate,
    });

    if (existingRecord) {
      // Log that the existing record was found and we are updating it
      logInfo(
        `Existing record found for user ${userId} and category ${categoryId}. Updating the record.`
      );

      // Update the total daily minutes if the record exists
      existingRecord.totalDailyMinutes += minutesUpdate;
      await existingRecord.save();

      // Log successful update
      logInfo(
        `Updated daily record for user ${userId} and category ${categoryId}. Total minutes: ${existingRecord.totalDailyMinutes}`
      );
      return res.status(200).json({ success: true, record: existingRecord });
    }

    // If no existing record, create a new one
    logInfo(
      `No existing record found for user ${userId} and category ${categoryId}. Creating a new record.`
    );

    const newRecord = new DailyRecord({
      userId,
      categoryId,
      totalDailyMinutes: minutesUpdate, // Set initial minutes
      date: date || new Date(), // Use provided date or the current date
    });

    await newRecord.save();

    // Log successful creation of the new record
    logInfo(
      `Created new daily record for user ${userId} and category ${categoryId}. Total minutes: ${newRecord.totalDailyMinutes}`
    );
    return res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    // Log any error that occurs during the creation or update process
    const validationErrors = validationErrorMessage(error);
    if (validationErrors) {
      logInfo(
        `Validation error while processing the record for user ${userId} and category ${categoryId}: ${JSON.stringify(
          validationErrors
        )}`
      );
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    // Log unexpected errors
    logError("Error creating or updating daily record: ", error);
    return res
      .status(500)
      .json({ success: false, message: "Error saving record.", error });
  }
};
