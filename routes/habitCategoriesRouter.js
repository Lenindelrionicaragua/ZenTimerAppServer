import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
import { autoCreateDefaultCategoriesController } from "../controllers/habitCategoriesControllers/autoCreateDefaultCategoriesController.js";
import { updateCategoryName } from "../controllers/habitCategoriesControllers/updateCategoryName.js";
import { deleteCategory } from "../controllers/habitCategoriesControllers/deleteCategory.js";
import { getTimeMetricsByDateRange } from "../controllers/habitCategoriesControllers/getTimeMetricsByDateRange.js";
import { getMonthlyTimeMetrics } from "../controllers/habitCategoriesControllers/getMonthlyTimeMetrics.js";
import { getWeeklyTimeMetrics } from "../controllers/habitCategoriesControllers/getWeeklyTimeMetrics.js";
import { getCategory } from "../controllers/habitCategoriesControllers/getCategory.js";
import { updateCategoryDailyGoal } from "../controllers/habitCategoriesControllers/updateCategoryDailyGoal.js";
import { deleteAllCategories } from "../controllers/habitCategoriesControllers/deleteAllCategories.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.patch("/:categoryId/name", updateCategoryName);
habitCategoriesRouter.post(
  "/auto-create-categories",
  autoCreateDefaultCategoriesController
);

habitCategoriesRouter.delete("/delete-all-categories", deleteAllCategories);
habitCategoriesRouter.delete("/:categoryId", deleteCategory);

habitCategoriesRouter.patch(
  "/:categoryId/update-daily-goal",
  updateCategoryDailyGoal
);

habitCategoriesRouter.get("/date-range-metrics", getTimeMetricsByDateRange);
habitCategoriesRouter.get("/monthly-metrics", getMonthlyTimeMetrics);
habitCategoriesRouter.get("/weekly-metrics", getWeeklyTimeMetrics);
habitCategoriesRouter.get("/", getCategory);

export default habitCategoriesRouter;
