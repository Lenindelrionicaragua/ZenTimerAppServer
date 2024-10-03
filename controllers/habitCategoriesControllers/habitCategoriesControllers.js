import Category from "../models/Category.js";

// Crear una nueva categoría de hábitos
export const createCategory = async (req, res) => {
  const { userId, categoryName } = req.body;

  try {
    const existingCategory = await Category.findOne({
      name: categoryName,
      createdBy: userId,
    });
    if (existingCategory)
      return res.status(400).json({ message: "Category already exists." });

    const newCategory = new Category({ name: categoryName, createdBy: userId });
    await newCategory.save();

    res
      .status(201)
      .json({
        message: "Category created successfully.",
        category: newCategory,
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating category.", error });
  }
};

// Obtener todas las categorías del usuario
export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = await Category.find({ createdBy: userId });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories.", error });
  }
};

// Actualizar el tiempo en una categoría
export const updateCategoryTime = async (req, res) => {
  const { categoryId } = req.params;
  const { minutes } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category)
      return res.status(404).json({ message: "Category not found." });

    category.totalMinutes += minutes;
    await category.save();

    res
      .status(200)
      .json({ message: "Category updated successfully.", category });
  } catch (error) {
    res.status(500).json({ message: "Error updating category time.", error });
  }
};
