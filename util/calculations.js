export const calculateTotalMinutes = (categoryStats) => {
  return categoryStats.reduce(
    (sum, category) => sum + category.totalMinutes,
    0
  );
};

export const calculateCategoryPercentages = (categoryStats, totalMinutes) => {
  return categoryStats.map((category) => {
    const percentage =
      totalMinutes > 0
        ? ((category.totalMinutes / totalMinutes) * 100).toFixed(2)
        : 0;
    return { ...category, percentage };
  });
};