import { logError, logInfo } from "../../util/logging.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";

export const createCategory = async (req, res) => {
  const allowedFields = ["name", "createdBy", "totalMinutes", "createdAt"];

  if (!(req.body.habitCategory instanceof Object)) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: You need to provide a valid 'habitCategory' object. Received: ${JSON.stringify(
        req.body.habitCategory
      )}`,
    });
  }

  const invalidFieldsError = validateAllowedFields(
    req.body.habitCategory,
    allowedFields
  );
  if (invalidFieldsError) {
    return res
      .status(400)
      .json({ success: false, msg: `Invalid request: ${invalidFieldsError}` });
  }

  try {
    const errorList = validateCategory(req.body.habitCategory);
    if (errorList.length > 0) {
      return res
        .status(400)
        .json({ success: false, msg: validationErrorMessage(errorList) });
    }

    const existingCategory = await HabitCategory.findOne({
      name: req.body.habitCategory.name,
      createdBy: req.body.habitCategory.createdBy,
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, msg: "Category already exists." });
    }

    const newCategory = new HabitCategory({
      name: req.body.habitCategory.name,
      createdBy: req.body.habitCategory.createdBy,
      totalMinutes: req.body.habitCategory.totalMinutes || 0,
      createdAt: req.body.habitCategory.createdAt || Date.now(),
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory,
    });
  } catch (error) {
    logError("Error creating category:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating category.", error });
  }
};
