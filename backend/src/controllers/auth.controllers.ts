import Send from "@utils/response.utils";
import { Request, Response } from "express";
import authSchema from "validations/auth.schema";
import z from "zod";
import AuthService from "services/auth.service";

class AuthControllers {
  static async Register(req: Request, res: Response) {
    const { username, email, password, password_confirmation } =
      req.body as z.infer<typeof authSchema.register>;
    try {
      const parsed = authSchema.register.parse({
        username,
        email,
        password,
        password_confirmation,
      });

      const newUser = await AuthService.register({
        username: parsed.username,
        email: parsed.email,
        password: parsed.password,
      });
      return Send.success(res, newUser, "User successfully registered");
    } catch (error) {
      console.error("Registration failed:", error);
      return Send.error(res, null, "Registration failed");
    }
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body as z.infer<typeof authSchema.login>;
    try {
      const userData = await AuthService.login({ email, password });

      res.cookie("accessToken", userData.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
        sameSite: "strict",
      });
      res.cookie("refreshToken", userData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return Send.success(res, {
        userId: userData.user.userId,
        username: userData.user.username,
        email: userData.user.email,
      });
    } catch (error) {
      console.error("Login failed:", error);
      return Send.error(res, null, "Login failed");
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (typeof userId !== "number")
        return Send.unauthorized(res, null, "Unauthorized");
      const user = await AuthService.getMe(userId);
      if (!user) return Send.notFound(res, null, "User not found");
      return Send.success(res, user, "Current user");
    } catch (error) {
      console.error("Get current user failed: ", error);
      return Send.error(res, null, "Get current user failed");
    }
  }

  static async LogoutCurrent(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        return Send.unauthorized(res, null, "Refresh token not found");

      await AuthService.logoutCurrent(refreshToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
      };
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      return Send.success(res, null, "Logged out successfully");
    } catch (error) {
      console.error("Logout current failed: ", error);
      return Send.unauthorized(res, null, "Logout current failed");
    }
  }

  static async LogoutAll(req: Request, res: Response) {
    try {
      if (typeof req.user?.userId !== "number")
        return Send.unauthorized(res, null, "User not found");

      await AuthService.logoutAll(req.user.userId);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        path: "/",
      };
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      return Send.success(res, null, "Logged out from all devices");
    } catch (error) {
      console.error("Logout all failed: ", error);
      return Send.error(res, null, "Logout all failed");
    }
  }
}

export default AuthControllers;
