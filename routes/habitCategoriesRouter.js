import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
// import { getCategoriesTime } from "../controllers/habitCategoriesControllers/getCategoriesTime.js";
// import { getCategoriesTimePercentage } from "../controllers/habitCategoriesControllers/getCategoriesTimePercentage.js";
import { updateCategoryName } from "../controllers/habitCategoriesControllers/updateCategoryName.js";
import { deleteCategory } from "../controllers/habitCategoriesControllers/deleteCategory.js";
import { getTimeMetricsByDateRange } from "../controllers/habitCategoriesControllers/getTimeMetricsByDateRange.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.patch("/:categoryId/name", updateCategoryName);
habitCategoriesRouter.delete("/:categoryId", deleteCategory);
// habitCategoriesRouter.get("/time", getCategoriesTime);
// habitCategoriesRouter.get("/time-percentage", getCategoriesTimePercentage);

habitCategoriesRouter.get("/:userId/time-metrics", getTimeMetricsByDateRange); // Obtener métricas de tiempo para un usuario

export default habitCategoriesRouter;
