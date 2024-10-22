import express from "express";
import { updateAndCreateRecords } from "../controllers/dailyRecordsControllers/updateAndCreateRecordsNew";

const dailyRecordsRouter = express.Router();

dailyRecordsRouter.post("/:categoryId", updateAndCreateRecords);

export default dailyRecordsRouter;
