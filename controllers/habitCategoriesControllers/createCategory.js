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

  // Validating all fields in the habitCategory object using validateCategory
  const errorList = validateCategory(habitCategory, true);
  if (errorList.length > 0) {
    return res.status(400).json({
      success: false,
      msg: validationErrorMessage(errorList),
    });
  }

  try {
    // Check if category with the same name exists for the user
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

    // Check the number of existing categories for the user
    const existingCategoriesCount = await HabitCategory.countDocuments({
      createdBy: userId,
    });

    // Limit to 6 categories
    if (existingCategoriesCount >= 6) {
      return res.status(400).json({
        success: false,
        msg: "You can only have up to 6 categories.",
      });
    }

    // Set createdAt if not provided
    const finalCreatedAt = habitCategory.createdAt || Date.now();

    // Set dailyGoal, defaulting to 0 if not provided
    const dailyGoal = habitCategory.dailyGoal || 0;

    // Generate a unique categoryId
    const categoryId =
      habitCategory.categoryId || new mongoose.Types.ObjectId();

    // Create new habit category
    const newCategory = new HabitCategory({
      name: habitCategory.name,
      createdBy: userId,
      createdAt: finalCreatedAt,
      dailyGoal: dailyGoal,
      categoryId: categoryId,
    });

    // Save the new category
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
