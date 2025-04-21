export const getMonthRange = (month, year) => {
  const validMonthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  let monthNumber;

  // Check if the month is a valid name or number
  if (isNaN(month)) {
    if (!validMonthNames.includes(month.toLowerCase())) {
      throw new Error("Invalid month name or format provided");
    }
    const date = new Date(`${month} 1, ${year}`);
    monthNumber = date.getMonth() + 1;
  } else {
    monthNumber = parseFloat(month);
  }

  // Validate that the month is an integer and within range (1-12)
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error(
      "Invalid month number provided. It should be an integer between 1 and 12.",
    );
  }

  // Create start and end date objects
  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 0); // Last day of the month

  return { startDate, endDate };
};
