import express, { Request, Response } from "express";
import { hashPass, verifyPass } from "../utils/hashPass";
import prisma from "../db";
import jwt from "jsonwebtoken";

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

router.post(
  "/login",
  async function (req: Request<{}, {}, Login>, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new Error("Email or password error2");
      }
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, password: true },
        });
        if (!existingUser) {
          throw new Error("Пользователь не найден");
        }
        const matchPassword = await verifyPass(password, existingUser.password);
        if (!matchPassword) {
          throw new Error("Неверный пароль");
        }
        const token = jwt.sign(
          { userId: existingUser.id },
          process.env.SECRET_KEY || "secret",
          { expiresIn: "7d" }
        );
        return res.status(200).json({ token });
      }
    } catch (e) {
      return res.status(400).json({ error: e });
    }
  }
);
router.post("/logout", async function (req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) {
      throw new Error("Token is required");
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY || "secret");
    if (!decoded) {
      throw new Error("Invalid or expired token");
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

router.post(
  "/register",
  async function (req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { username, email, password } = req.body;
      if (!email || !password || !username)
        throw new Error("Email or password error1");
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (existingUser) {
          throw new Error("Пользователь уже существует");
        }
      } // есть ли такой пользователь в бд
      const hashedPass = await hashPass(password);
      const newUser = await prisma.user.create({
        data: { username, email, password: hashedPass },
      });
      return res.status(200).json({ text: newUser });
    } catch (e) {
      return res.status(400).json({ error: e });
    }
  }
);

export default router;
