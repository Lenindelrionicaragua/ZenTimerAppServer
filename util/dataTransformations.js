import { logError } from "./logging";

export const mapRecordsToDateAndMinutes = (records) => {
  return records.map((record) => ({
    date: record.date,
    totalDailyMinutes: record.totalDailyMinutes,
  }));
};

export const addPercentagePerDayToRecords = (records, totalDailyMinutes) => {
  return records.map((record) => {
    // Convert record.date to ISO string if it's a Date object, or ensure it's a string
    const dateString =
      record.date instanceof Date
        ? record.date.toISOString()
        : String(record.date);

    // Ensure dateString is in 'YYYY-MM-DD' format
    const dateKey = dateString.split("T")[0];

    // Get the total minutes for the day from the totalDailyMinutes object
    const totalForDay = totalDailyMinutes[dateKey];

    // Check if totalForDay exists to avoid errors
    if (!totalForDay) {
      logError(`ERROR: Total minutes not found for date: ${dateKey}`);
      return { ...record, dailyPercentage: null }; // Return null percentage if total minutes not found
    }

    // Calculate the percentage of the total daily minutes
    const percentage = (record.totalDailyMinutes / totalForDay) * 100;

    // Return the original record with the calculated percentage and ensure the date is a string
    return {
      ...record,
      date: dateString, // Ensure date is returned as a string in ISO format
      dailyPercentage: percentage.toFixed(2), // Add the percentage, rounded to two decimal places
    };
  });
};

// Function to count unique days across all categories
export const countUniqueDays = (categoryStats) => {
  // Use a Set to ensure only unique dates are kept
  const uniqueDates = new Set();

  categoryStats.forEach((category) => {
    category.records.forEach((record) => {
      uniqueDates.add(record.date.toISOString().split("T")[0]); // Only keep the date without time
    });
  });

  return uniqueDates.size;
};

// Function to count the number of categories
export const countCategoriesWithData = (categoryStats, start, end) => {
  return categoryStats.filter((category) => {
    return (
      category.records.length > 0 &&
      category.records.some((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      })
    );
  }).length;
};
