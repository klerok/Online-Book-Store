import { verifyPass } from "@utils/hashPass";
import Send from "@utils/response.utils";
import prisma from "db";
import { Request, Response } from "express";
import authSchema from "validations/auth.schema";
import z from "zod";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config";
class AuthControllers {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body as z.infer<typeof authSchema.login>;
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true, email: true, password: true },
      });
      if (!user) {
        return Send.error(res, null, "Invalid credentials");
      }
      const isPasswordValid = await verifyPass(password, user.password);
      if (!isPasswordValid) {
        return Send.error(res, null, "Invalid credentials.");
      }
      const accessToken = jwt.sign({ userId: user.id }, authConfig.secret, {
        expiresIn: authConfig.secret_expires_in as any,
      });
      const refreshToken = jwt.sign(
        { userId: user.id },
        authConfig.refresh_secret,
        { expiresIn: authConfig.refresh_secret_expires_in as any }
      );
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return Send.success(res, {
        id: user.id,
        username: user.username,
        email: user.email,
      });
    } catch (error) {
      console.error("Login failed:", error);
      return Send.error(res, null, "Login failed");
    }
  }
}

export default AuthControllers;
