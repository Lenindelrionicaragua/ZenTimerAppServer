export const mapRecordsToDateAndMinutes = (records) => {
  return records.map((record) => ({
    date: record.date,
    totalDailyMinutes: record.totalDailyMinutes,
  }));
};
