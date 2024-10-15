import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
// import { getCategoriesTime } from "../controllers/habitCategoriesControllers/getCategoriesTime.js";
// import { getCategoriesTimePercentage } from "../controllers/habitCategoriesControllers/getCategoriesTimePercentage.js";
import { updateCategoryName } from "../controllers/habitCategoriesControllers/updateCategoryName.js";
import { deleteCategory } from "../controllers/habitCategoriesControllers/deleteCategory.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.patch("/:categoryId/name", updateCategoryName);
habitCategoriesRouter.delete("/:categoryId", deleteCategory);
// habitCategoriesRouter.get("/time", getCategoriesTime);
// habitCategoriesRouter.get("/time-percentage", getCategoriesTimePercentage);

export default habitCategoriesRouter;
