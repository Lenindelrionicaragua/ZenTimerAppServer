export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const categories = await Category.find({ createdBy: userId });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories.", error });
  }
};
