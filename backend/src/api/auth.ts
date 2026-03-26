import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import AuthControllers from "@controllers/auth.controllers";
import { validate } from "middleware/validate.middleware";
import authSchema from "validations/auth.schema";

const router = express.Router();

router.post("/register", validate({body: authSchema.register}),AuthControllers.Register);

router.post("/login", validate({body: authSchema.login}),AuthControllers.login);

router.get("/me", authMiddleware, AuthControllers.me);

router.post("/logout", AuthControllers.LogoutCurrent);

router.post("/logout-all", AuthControllers.LogoutAll);

export default router;
