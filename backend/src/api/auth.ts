import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import AuthControllers from "@controllers/auth.controllers";

const router = express.Router();

router.post("/register", AuthControllers.Register);

router.post("/login", AuthControllers.login);

router.get("/me", authMiddleware, AuthControllers.me);

router.post("/logout", AuthControllers.LogoutCurrent);

router.post("/logout-all", authMiddleware, AuthControllers.LogoutAll);

export default router;
