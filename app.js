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

// Configuración de CORS
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:8081",
      "https://zen-timer-app-server-7f9db58def4c.herokuapp.com",
    ],
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
