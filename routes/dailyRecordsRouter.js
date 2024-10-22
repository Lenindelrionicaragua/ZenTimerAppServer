import express from "express";
import { updateAndCreateRecords } from "../controllers/dailyRecordsControllers/updateAndCreateRecords";

const dailyRecordsRouter = express.Router();

dailyRecordsRouter.post("/:categoryId", updateAndCreateRecords);

export default dailyRecordsRouter;
