import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";
import { logError, logInfo } from "../../util/logging.js";

export const createCategory = async (req, res) => {
  const { habitCategory } = req.body;
  const userId = req.userId;

  if (!(habitCategory instanceof Object)) {
    return res.status(400).json({
      success: false,
      msg: `Invalid request: You need to provide a valid 'habitCategory' object. Received: ${JSON.stringify(
        habitCategory,
      )}`,
    });
  }

  const errorList = validateCategory(habitCategory, true);
  if (errorList.length > 0) {
    return res.status(400).json({
      success: false,
      msg: validationErrorMessage(errorList),
    });
  }

  try {
    const existingCategory = await HabitCategory.findOne({
      name: habitCategory.name,
      createdBy: userId,
    }).collation({ locale: "en", strength: 1 });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        msg: "Category already exists.",
      });
    }

    const existingCategoriesCount = await HabitCategory.countDocuments({
      createdBy: userId,
    });

    if (existingCategoriesCount >= 6) {
      return res.status(400).json({
        success: false,
        msg: "You can only have up to 6 categories.",
      });
    }

    const finalCreatedAt = habitCategory.createdAt || Date.now();

    const dailyGoal = habitCategory.dailyGoal || 0;

    const categoryId =
      habitCategory.categoryId || new mongoose.Types.ObjectId();

    const newCategory = new HabitCategory({
      name: habitCategory.name,
      createdBy: userId,
      createdAt: finalCreatedAt,
      dailyGoal: dailyGoal,
      categoryId: categoryId,
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: newCategory,
    });
    logInfo(`New Category created: ${JSON.stringify(newCategory)}`);
  } catch (error) {
    logError("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category.",
      error,
    });
  }
};
