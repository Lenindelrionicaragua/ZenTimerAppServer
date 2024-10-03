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

    res.status(201).json({
      message: "Category created successfully.",
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating category.", error });
  }
};
