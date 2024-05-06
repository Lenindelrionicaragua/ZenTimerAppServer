import jwt from "jsonwebtoken";
import { logInfo, logError } from "../util/logging.js";

export const requireAuth = (req, res, next) => {
  const session = req.cookies.session;

  logInfo("Verifying token in session cookie...");

  if (!session) {
    const errorMessage = "Session cookie not found.";
    logError(errorMessage);
    return res.status(403).send({ error: errorMessage });
  }

  // Verify token which is in cookie value
  jwt.verify(session, process.env.JWT_SECRET, (err, data) => {
    if (err) {
      const errorMessage = "Error verifying token in session cookie:";
      // logError(errorMessage);
      return res.status(403).send({ error: errorMessage });
    }

    if (!data.userId) {
      const errorMessage = "User not found in session data.";
      // logError(errorMessage);
      return res.status(403).send({ error: errorMessage });
    }

    if (data.userId) {
      logInfo("User authenticated successfully. User ID:", data.userId);
      req.userId = data.userId;
      next();
    }
  });
};
