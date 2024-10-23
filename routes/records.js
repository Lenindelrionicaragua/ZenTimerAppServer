import express from "express";
import { createRecords } from "../controllers/recordsControllers/createRecords.js";

const recordsRouter = express.Router();

recordsRouter.post("/:categoryId", createRecords);

export default recordsRouter;
