import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/authMiddleware.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import habitCategoriesRouter from "./routes/habitCategoriesRouter.js";
import dailyTimeRecordRouter from "./routes/dailyTimeRecord.js";

dotenv.config();

// Create an express server
const app = express();

// Tell express to use the json middleware
app.use(express.json());

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:8081",
  "http://192.168.178.182:3000", // Lenin
  "http://192.168.178.182:8081", // Lenin
  "http://192.168.178.121:3000", // Liz
  "http://192.168.178.121:8081", // Liz
  "https://habit-tracker-app-front.netlify.app",
];

// CORS configuration
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

/****** Attach routes ******/
/**
 * We use /api/ at the start of every route!
 * As we also host our client code on heroku we want to separate the API endpoints.
 */

app.use("/api/auth", authRouter);
app.use("/api/user", requireAuth, userRouter);
app.use("/api/habit-categories", requireAuth, habitCategoriesRouter);
app.use("/api/time-records", requireAuth, dailyTimeRecordRouter);

export default app;
