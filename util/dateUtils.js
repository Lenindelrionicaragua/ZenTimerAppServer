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
    monthNumber = parseFloat(month); // Change to parseFloat to keep decimals
  }

  // Validate the month range (1-12) and ensure it is an integer
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error(
      "Invalid month number provided. It should be an integer between 1 and 12."
    );
  }

  // Create start and end date objects
  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 0); // Last day of the month

  return { startDate, endDate };
};
