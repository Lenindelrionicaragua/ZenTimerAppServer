import mongoose from "mongoose";
import HabitCategory, { validateCategory } from "../../models/habitCategory.js";
import { logError, logInfo } from "../../util/logging.js";
import validateAllowedFields from "../../util/validateAllowedFields.js";
import validationErrorMessage from "../../util/validationErrorMessage.js";

export const updateCategoryName = async (req, res) => {
  const { categoryId } = req.params;
  const { name: newName, createdBy } = req.body; // Asegúrate de extraer createdBy del cuerpo de la solicitud

  const allowedFields = ["name", "createdBy"];

  // Validar ID de la categoría
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    logInfo(`Invalid category ID: ${categoryId}`);
    return res
      .status(400)
      .json({ message: "BAD REQUEST: Invalid category ID." });
  }

  // Validar campos permitidos
  const invalidFieldsError = validateAllowedFields(req.body, allowedFields);
  if (invalidFieldsError) {
    logInfo(`Invalid fields in request body: ${invalidFieldsError}`);
    return res.status(400).json({
      message: `BAD REQUEST: ${invalidFieldsError}`,
    });
  }

  try {
    logInfo(`Searching for category with ID: ${categoryId}`);
    const category = await HabitCategory.findById(categoryId);

    // Comprobar si la categoría existe
    if (!category) {
      logInfo(`Category not found: ${categoryId}`);
      return res.status(404).json({ message: "Category not found." });
    }

    // Debugging: Agregar registros para verificar los valores
    logInfo(
      `Category createdBy: ${category.createdBy}, Incoming createdBy: ${createdBy}`
    );

    // Verificar si el creador de la categoría coincide con el userId proporcionado
    if (category.createdBy.toString() !== createdBy) {
      logInfo(`User not authorized to update category: ${createdBy}`);
      return res.status(403).json({
        message: "Forbidden: You are not authorized to update this category.",
      });
    }

    const errorList = validateCategory({ name: newName, createdBy });
    if (errorList.length > 0) {
      logInfo(`Validation failed for new name: ${errorList.join(", ")}`);
      return res
        .status(400)
        .json({ message: validationErrorMessage(errorList) });
    }

    if (category.name === newName) {
      logInfo(`The new name is the same as the current name.`);
      return res.status(400).json({
        message: "The new name must be different from the current name.",
      });
    }

    // Actualizar el nombre de la categoría
    category.name = newName;
    await category.save();

    logInfo(
      `Category ${categoryId} updated successfully with new name: ${newName}`
    );
    return res
      .status(200)
      .json({ message: "Category name updated successfully.", category });
  } catch (error) {
    logError(`Error updating category name: ${error}`);
    return res.status(500).json({
      message: "Error updating category name.",
      error: validationErrorMessage([error.message]),
    });
  }
};
