import express from "express";
import { createAndUpdateDailyRecord } from "../controllers/dailyRecordsControllers/createAndUpdateDailyRecords";

const dailyRecordsRouter = express.Router();

dailyRecordsRouter.post("/:categoryId", createAndUpdateDailyRecord);

export default dailyRecordsRouter;
