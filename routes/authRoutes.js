import express from "express";
import { signup } from "../controllers/authControllers/signupController.js";
import { login } from "../controllers/authControllers/loginController.js";
import { logout } from "../controllers/authControllers/logoutController.js";

const authRouter = express.Router();

authRouter.post("/sign-up", signup);
authRouter.post("/log-in", login);
authRouter.post("/log-out", logout);

export default authRouter;
