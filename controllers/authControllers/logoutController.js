import { logInfo, logError } from "../../util/logging.js";

export const logout = (req, res) => {
  try {
    // Check if cookies exist and log them, otherwise log the token if available
    if (Object.keys(req.cookies).length > 0) {
      console.log("Current cookies:", req.cookies);
    } else if (req.headers["authorization"]) {
      console.log(
        "No cookies found, but found token:",
        req.headers["authorization"]
      );
    } else {
      console.log("No cookies or token found.");
    }

    // Check for active session (either cookie or token)
    if (!req.cookies.session && !req.headers["authorization"]) {
      return res.status(400).json({
        success: false,
        message: "No active session or token to log out from.",
      });
    }

    // Clear cookies for mobile users
    if (req.cookies.session) {
      res.clearCookie("session", { httpOnly: true, secure: true });
      res.clearCookie("zenTimerToken", { httpOnly: true, secure: true }); // Add other relevant cookies
    }

    // Log out action for web users using token (if applicable)
    if (req.headers["authorization"]) {
      // Here you could implement any logic related to invalidating the token if necessary
      // For example: invalidateToken(req.headers['authorization']);
      console.log("User is logged out via token");
    }

    logInfo(`User with ID ${req.user.id} successfully logged out.`);

    res.status(204).send(); // No content response
  } catch (error) {
    logError("Logout error: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during logout",
    });
  }
};
