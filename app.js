import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/authMiddleware.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import dotenv from "dotenv";

dotenv.config();

// Create an express server
const app = express();

// Middleware to force HTTPS only if in production
app.use((req, res, next) => {
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// Middleware to parse JSON
app.use(express.json());

// Configure CORS based on the environment
const corsOptions = {
  credentials: true,
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.UI_BASE_URL
      : "http://localhost:8081",
};

app.use(cors(corsOptions));

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
