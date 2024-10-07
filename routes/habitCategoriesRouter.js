import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
import { updateCategoryTime } from "../controllers/habitCategoriesControllers/updateCategoryTime.js";
import { getCategoriesTime } from "../controllers/habitCategoriesControllers/getCategoriesTime.js";
import { getCategoriesPorcenTime } from "../controllers/habitCategoriesControllers/getCategoriesPorcenTime.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);
habitCategoriesRouter.get("/", getCategoriesTime);
habitCategoriesRouter.get("/", getCategoriesPorcenTime);
habitCategoriesRouter.put("/:categoryId", updateCategoryTime);

export default habitCategoriesRouter;
