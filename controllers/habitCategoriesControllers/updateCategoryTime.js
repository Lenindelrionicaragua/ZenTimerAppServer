import mongoose from "mongoose";
import HabitCategory from "../../models/habitCategory.js";
import { logError, logInfo } from "../../util/logging.js";

export const updateCategoryTime = async (req, res) => {
  const { categoryId } = req.params;
  const { minutes } = req.body; // Extract minutes from request body

  // Validate the category ID
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    logInfo(`Invalid category ID: ${categoryId}`);
    return res
      .status(400)
      .json({ message: "BAD REQUEST: Invalid category ID." });
  }

  // Validate minutes
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) {
    logInfo("Minutes must be a non-negative finite number.");
    return res.status(400).json({
      message: "BAD REQUEST: Minutes must be a non-negative finite number.",
    });
  }

  try {
    logInfo(`Searching for category with ID: ${categoryId}`);
    const category = await HabitCategory.findById(categoryId);

    if (!category) {
      logInfo(`Category not found: ${categoryId}`);
      return res.status(404).json({ message: "Category not found." });
    }

    // Get today's date (resetting hours, minutes, seconds)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if a daily record exists for today
    const existingRecord = category.dailyRecords.find((record) => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    if (existingRecord) {
      // Update existing daily record
      existingRecord.minutes += minutes;
      logInfo(
        `Updated existing record for today with ${minutes} additional minutes.`
      );
    } else {
      // Create a new daily record
      category.dailyRecords.push({ date: today, minutes });
      logInfo(`Created a new record for today with ${minutes} minutes.`);
    }

    // Save the updated category
    await category.save();
    logInfo(
      `Category ${categoryId} updated successfully with new daily record.`
    );

    res
      .status(200)
      .json({ message: "Category time updated successfully.", category });
  } catch (error) {
    logError(`Error updating category time: ${error}`);
    res.status(500).json({ message: "Error updating category time.", error });
  }
};
