import express from "express";
import { createCategory } from "../controllers/habitCategoriesControllers/createCategory.js";
// import { getCategories } from "../controllers/habitCategoriesControllers/getCategories.js";
// import { updateCategoryTime } from "../controllers/habitCategoriesControllers/updateCategoryTime.js";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);

// habitCategoriesRouter.get("/", getCategories);

// habitCategoriesRouter.put("/:categoryId", updateCategoryTime);

export default habitCategoriesRouter;
