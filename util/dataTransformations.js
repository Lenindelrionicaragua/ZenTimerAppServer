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
