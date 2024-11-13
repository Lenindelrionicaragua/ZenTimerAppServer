import { autoCreateDefaultCategories } from "../../util/autoCreateDefaultCategories.js";
import { logError } from "../../util/logging.js";

export const autoCreateDefaultCategoriesController = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required." });
    }

    await autoCreateDefaultCategories(userId);

    return res
      .status(200)
      .json({ success: true, message: "Categories created successfully." });
  } catch (error) {
    logError("Error in autoCreateCategoriesController:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
