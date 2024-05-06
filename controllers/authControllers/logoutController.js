import { logInfo } from "../../util/logging.js";

export const logout = (req, res) => {
  try {
    res.clearCookie("session");
    logInfo("User successfully logged out");

    res
      .status(200)
      .json({ success: true, message: "User successfully logged out" });
  } catch (error) {
    logError(error);
    res
      .status(500)
      .json({ success: false, message: "An error occurred during logout" });
  }
};
