export const calculateTotalMinutes = (categoryStats) => {
  return categoryStats.reduce(
    (sum, category) => sum + (category.totalMinutes || 0),
    0,
  );
};

export const calculateCategoryPercentages = (categoryStats, totalMinutes) => {
  return categoryStats.map((category) => {
    const percentage =
      totalMinutes > 0
        ? parseFloat(((category.totalMinutes / totalMinutes) * 100).toFixed(2))
        : 0;
    return { ...category, percentage };
  });
};

export const calculateDailyMinutes = (allRecords) => {
  const dailyMinutes = {};

  allRecords.forEach((record) => {
    const date = record.date.toISOString().split("T")[0];
    dailyMinutes[date] =
      (dailyMinutes[date] || 0) + (record.totalDailyMinutes || 0);
  });

  // If no records, return 0 instead of an empty object
  if (Object.keys(dailyMinutes).length === 0) {
    return 0;
  }

  // Convert the object to an array and sort it
  const sortedDailyMinutes = Object.entries(dailyMinutes).sort(
    ([dateA], [dateB]) => new Date(dateA) - new Date(dateB),
  );

  // Convert the array back to an object, if necessary
  const orderedDailyMinutes = Object.fromEntries(sortedDailyMinutes);

  return orderedDailyMinutes;
};
