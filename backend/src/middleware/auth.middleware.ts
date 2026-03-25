import authConfig from "@config/auth.config";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies.accessToken;
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, authConfig.secret);
    if (typeof decoded === "string") return res.sendStatus(401);

    const userId = decoded.userId;
    if (typeof userId !== "number") return res.sendStatus(401);
    req.user = { userId };
    return next();
  } catch {
    return res.sendStatus(401);
  }
}
