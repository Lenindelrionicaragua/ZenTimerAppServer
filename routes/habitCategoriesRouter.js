import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
import { updateCategoryTime } from "../controllers/habitCategoriesControllers/updateCategoryTime.js";
import { getCategoriesTime } from "../controllers/habitCategoriesControllers/getCategoriesTime.js";
import { getCategoriesTimePercentage } from "../controllers/habitCategoriesControllers/getCategoriesTimePercentage.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.get("/time", getCategoriesTime);
habitCategoriesRouter.get("/time-percentage", getCategoriesTimePercentage);
habitCategoriesRouter.put("/:categoryId", updateCategoryTime);

export default habitCategoriesRouter;
