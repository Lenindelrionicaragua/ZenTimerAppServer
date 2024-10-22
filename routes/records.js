import express from "express";
import { createRecords } from "../controllers/recordsControllers/createRecords";

const dailyRecordsRouter = express.Router();

dailyRecordsRouter.post("/:categoryId", createRecords);

export default dailyRecordsRouter;
