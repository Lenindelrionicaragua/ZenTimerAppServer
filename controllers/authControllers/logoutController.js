import { logInfo, logError } from "../../util/logging.js";

export const logout = (req, res) => {
  try {
    console.log("Current cookies:", req.cookies);

    // Check for active session
    if (!req.cookies.session) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No active session to log out from.",
        });
    }

    // Clear cookies
    res.clearCookie("session", { httpOnly: true, secure: true });
    res.clearCookie("zenTimerToken", { httpOnly: true, secure: true }); // Add other relevant cookies

    logInfo(`User with ID ${req.user.id} successfully logged out.`);

    res.status(204).send(); // No content response
  } catch (error) {
    logError("Logout error: ", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "An error occurred during logout",
      });
  }
};
