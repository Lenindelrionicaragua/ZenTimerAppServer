import express from "express";
import { createRecords } from "../controllers/recordsControllers/createRecords";

const recordsRouter = express.Router();

recordsRouter.post("/:categoryId", createRecords);

export default recordsRouter;
