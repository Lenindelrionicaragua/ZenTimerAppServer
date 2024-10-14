import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
// import { getCategoriesTime } from "../controllers/habitCategoriesControllers/getCategoriesTime.js";
// import { getCategoriesTimePercentage } from "../controllers/habitCategoriesControllers/getCategoriesTimePercentage.js";
import { updateCategoryName } from "../controllers/habitCategoriesControllers/updateCategoryName.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
// habitCategoriesRouter.get("/time", getCategoriesTime);
// habitCategoriesRouter.get("/time-percentage", getCategoriesTimePercentage);
habitCategoriesRouter.patch("/:categoryId/name", updateCategoryName);

export default habitCategoriesRouter;
