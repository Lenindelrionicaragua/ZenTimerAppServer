import express from "express";
import { signup } from "../controllers/authControllers/signupController.js";
import { signInWithGoogleController } from "../controllers/authControllers/signInWithGoogleController.js";
import { login } from "../controllers/authControllers/loginController.js";
import { logout } from "../controllers/authControllers/logoutController.js";

const authRouter = express.Router();

authRouter.post("/sign-up", signup);
authRouter.post("/sign-in-with-google", signInWithGoogleController);
authRouter.post("/log-in", login);
authRouter.post("/log-out", logout);

export default authRouter;
