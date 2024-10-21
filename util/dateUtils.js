export const getMonthRange = (month, year) => {
  let monthNumber;

  // Convert month string to number if needed, and handle invalid month strings
  if (isNaN(month)) {
    const date = new Date(`${month} 1, ${year}`);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid month name or format provided");
    }
    monthNumber = date.getMonth() + 1;
  } else {
    monthNumber = parseInt(month, 10);
  }

  // Validate the month range (1-12)
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Invalid month number provided");
  }

  // Create start and end date objects
  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 0); // Last day of the month

  return { startDate, endDate };
};
