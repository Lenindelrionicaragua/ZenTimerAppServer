import express from "express";
import { createOrUpdateDailyRecord } from "../controllers/DailyRecordsControllers/createOrUpdateDailyRecords";

const dailyRecordsRouter = express.Router();

dailyRecordsRouter.post("/dailyRecords", createOrUpdateDailyRecord);

export default dailyRecordsRouter;
