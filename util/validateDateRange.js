import moment from "moment";
import validationErrorMessage from "./validationErrorMessage";

/**
 * This function validates a range of dates (startDate and endDate).
 * It returns an array of error messages if there are validation issues.
 *
 * @param {string} startDate - The start date in 'YYYY-MM-DD' format
 * @param {string} endDate - The end date in 'YYYY-MM-DD' format
 * @returns {Array} - An array containing validation error messages, if any.
 */
const validateDateRange = (startDate, endDate) => {
  const errors = [];

  if (!moment(startDate, "YYYY-MM-DD", true).isValid()) {
    errors.push("startDate must be in a valid ISO format (YYYY-MM-DD).");
  }

  if (!moment(endDate, "YYYY-MM-DD", true).isValid()) {
    errors.push("endDate must be in a valid ISO format (YYYY-MM-DD).");
  }

  if (moment(startDate).isAfter(moment(endDate))) {
    errors.push("startDate cannot be greater than endDate.");
  }

  if (errors.length > 0) {
    return validationErrorMessage(errors);
  }

  return null;
};

export default validateDateRange;
