export const mapRecordsToDateAndMinutes = (records) => {
  return records.map((record) => ({
    date: record.date,
    totalDailyMinutes: record.totalDailyMinutes,
  }));
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
export const countCategoriesWithData = (categoryStats) => {
  // Simply return the number of elements in the categoryStats array
  return categoryStats.length;
};
