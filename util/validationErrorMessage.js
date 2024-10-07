/**
 * In our models, we will have validation checkers that should return an array of error messages.
 * This function creates a user-friendly message for the API user, indicating what is wrong.
 */

// errorList should be an array of strings
const validationErrorMessage = (errorList) => {
  if (Array.isArray(errorList)) {
    return `BAD REQUEST: ${errorList.join(", ")}`;
  } else {
    return "BAD REQUEST: An unknown error occurred.";
  }
};

export default validationErrorMessage;
