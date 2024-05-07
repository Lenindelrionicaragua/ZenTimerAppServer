import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/authMiddleware.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";

dotenv.config();

// Create an express server
const app = express();

// Tell express to use the json middleware
app.use(express.json());
// Restrict access to only our UI
app.use(
  cors({
    credentials: true,
    origin: process.env.UI_BASE_URL,
  })
);
app.use(cookieParser());

/****** Attach routes ******/
/**
 * We use /api/ at the start of every route!
 * As we also host our client code on heroku we want to separate the API endpoints.
 */

app.use("/api/auth", authRouter);
app.use("/api/user", requireAuth, userRouter);

// app.use("/api/user", userRouter);

export default app;
