import express from "express";
import { getUsers } from "../controllers/userController.js";
import { verifyEmail } from "../controllers/authControllers/emailVerificationController.js";

const userRouter = express.Router();

userRouter.get("/", getUsers);

export default userRouter;
