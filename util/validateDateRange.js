import moment from "moment";
import validationErrorMessage from "./validationErrorMessage";

// Validate the date range (startDate and endDate)
const validateDateRange = (startDate, endDate) => {
  const errorList = [];

  // Check if startDate is valid
  if (!startDate || !moment(startDate, "YYYY-MM-DD", true).isValid()) {
    errorList.push("startDate must be in a valid ISO format (YYYY-MM-DD).");
  }

  // Check if endDate is valid
  if (!endDate || !moment(endDate, "YYYY-MM-DD", true).isValid()) {
    errorList.push("endDate must be in a valid ISO format (YYYY-MM-DD).");
  }

  // Check if startDate is greater than endDate
  if (startDate && endDate && moment(startDate).isAfter(moment(endDate))) {
    errorList.push("startDate cannot be greater than endDate.");
  }

  if (errorList.length > 0) {
    return validationErrorMessage(errorList);
  }

  return null;
};

export default validateDateRange;
