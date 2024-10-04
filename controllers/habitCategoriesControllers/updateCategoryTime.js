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
