import HabitCategory from "../models/HabitCategory.js";
import { logInfo } from "../util/logging.js";

// Validate the input for habit categories
const validateCategoryInput = (data) => {
  const errors = [];

  // Validate category name: only letters, spaces, and hyphens; max length 10
  const namePattern = /^[A-Za-z\s-]{1,10}$/; // Match letters, spaces, and hyphens, up to 10 characters
  if (!data.name || !namePattern.test(data.name)) {
    errors.push(
      "Category name is required and must contain only letters, spaces, or hyphens, with a maximum length of 10 characters."
    );
    logInfo("Validation failed: Category name must be valid.");
  }

  // Validate total minutes: must be a positive number, not zero, and no more than 1440
  if (
    typeof data.totalMinutes !== "number" ||
    data.totalMinutes <= 0 ||
    data.totalMinutes > 1440
  ) {
    errors.push(
      "Total minutes must be a positive number (greater than 0) and cannot exceed 1440 minutes (24 hours)."
    );
    logInfo(
      "Validation failed: Total minutes must be a positive number and within the allowed range."
    );
  }

  return errors;
};

// Create a new habit category
export const createCategory = async (req, res) => {
  const { name, totalMinutes } = req.body;

  // Validate the input
  const errors = validateCategoryInput({ name, totalMinutes });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const newCategory = new HabitCategory({
      name,
      createdBy: req.user._id,
      totalMinutes,
    });
    await newCategory.save();
    res.status(201).json({
      message: "Category created successfully.",
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating category.", error });
  }
};

// Update time in a habit category
export const updateCategoryTime = async (req, res) => {
  const { categoryId } = req.params;
  const { totalMinutes } = req.body;

  // Validate that the category ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: "Invalid category ID." });
  }

  // Validate total minutes
  if (
    typeof totalMinutes !== "number" ||
    totalMinutes <= 0 ||
    totalMinutes > 1440
  ) {
    return res.status(400).json({
      message:
        "Total minutes must be a positive number (greater than 0) and cannot exceed 1440 minutes (24 hours).",
    });
  }

  try {
    const category = await HabitCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    category.totalMinutes += totalMinutes; // Add the time
    await category.save();

    res
      .status(200)
      .json({ message: "Category updated successfully.", category });
  } catch (error) {
    res.status(500).json({ message: "Error updating category time.", error });
  }
};
