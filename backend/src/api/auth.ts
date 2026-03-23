import express, { Request, Response } from "express";
import { hashPass, verifyPass } from "../utils/hashPass";
import prisma from "../db";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.middleware";
import AuthControllers from "@controllers/auth.controllers";

interface RegisterBody {
  username?: string;
  email?: string;
  password?: string;
}

interface Login {
  email?: string;
  password?: string;
}

const router = express.Router();

router.post("/login", AuthControllers.login);
router.post(
  "/logout",
  authMiddleware,
  async function (req: Request, res: Response) {
    return res.status(200).json({ message: "Logged out successfully" });
  }
);

router.post(
  "/register",
  AuthControllers.Register
);

export default router;
