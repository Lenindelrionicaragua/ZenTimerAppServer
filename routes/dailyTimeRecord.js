import express from "express";
import { createDailyTimeRecords } from "../controllers/dailyTimeRecords/createDailyTimeRecords.js";

const dailyTimeRecordRouter = express.Router();

dailyTimeRecordRouter.post("/:categoryId", createDailyTimeRecords);

export default dailyTimeRecordRouter;
