import jwt from "jsonwebtoken";
import { logInfo, logError } from "../util/logging.js";

export const requireAuth = (req, res, next) => {
  const session = req.cookies.session;

  logInfo("Verifying token in session cookie...");

  // Check if the session cookie is missing or empty
  if (!session || session.trim() === "") {
    // Added check for empty cookies
    const errorMessage = "Session cookie not found.";
    logError(errorMessage);
    // Send response with success: false and custom error message
    return res.status(401).send({
      success: false,
      msg: "BAD REQUEST: Authentication required.",
    });
  }

  // Verify token which is in cookie value
  jwt.verify(session, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      const errorMessage = "Error verifying token in session cookie:";
      logError(errorMessage);
      return res.status(401).send({
        success: false,
        msg: "BAD REQUEST: Authentication failed.",
      });
    }

    // Check if userId is not found in the session data
    if (!data.userId) {
      const errorMessage = "User not found in session data.";
      logError(errorMessage);
      return res.status(401).send({
        success: false,
        msg: "BAD REQUEST: Authentication failed.",
      });
    }

    // If authentication is successful, attach userId to request and proceed
    if (data.userId) {
      logInfo("User authenticated successfully. User ID:", data.userId);
      req.userId = data.userId;
      next();
    }
  });
};
