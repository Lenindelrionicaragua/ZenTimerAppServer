import express from "express";
import {
  getCategories,
  createCategory,
  updateCategoryTime,
} from "../controllers/habitCategoriesControllers/habitCategoriesControllers";

const habitCategoriesRouter = express.Router();

habitCategoriesRouter.post("/create", createCategory);

habitCategoriesRouter.get("/", getCategories);

habitCategoriesRouter.put("/:categoryId", updateCategoryTime);

export default habitCategoriesRouter;
