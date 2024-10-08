import fs from "fs";
import path from "path";
import HabitCategory from "../models/habitCategory.js";
import { logInfo, logError } from "../util/logging.js";

// Load mock data from the JSON file
export const populateMockDatabase = async () => {
  try {
    const filePath = path.join(__dirname, "mockHabitCategoryData.json");
    const data = fs.readFileSync(filePath, "utf8");
    const categories = JSON.parse(data);

    // Clear existing categories before populating new ones
    await HabitCategory.deleteMany({});

    // Insert new data
    await HabitCategory.insertMany(categories);
    logInfo("Mock database populated with test data.");
  } catch (error) {
    logError("Error populating mock database: ", error);
    throw error;
  }
};
