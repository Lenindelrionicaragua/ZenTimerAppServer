import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
import { updateCategoryName } from "../controllers/habitCategoriesControllers/updateCategoryName.js";
import { deleteCategory } from "../controllers/habitCategoriesControllers/deleteCategory.js";
import { getTimeMetricsByDateRange } from "../controllers/habitCategoriesControllers/getTimeMetricsByDateRange.js";
import { getMonthlyTimeMetrics } from "../controllers/habitCategoriesControllers/getMonthlyTimeMetrics.js";
import { getWeeklyTimeMetrics } from "../controllers/habitCategoriesControllers/getWeeklyTimeMetrics.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.patch("/:categoryId/name", updateCategoryName);
habitCategoriesRouter.delete("/:categoryId", deleteCategory);

habitCategoriesRouter.get("/date-range-metrics", getTimeMetricsByDateRange);
habitCategoriesRouter.get("/monthly-metrics", getMonthlyTimeMetrics);
habitCategoriesRouter.get("/weekly-metrics", getWeeklyTimeMetrics);

export default habitCategoriesRouter;
