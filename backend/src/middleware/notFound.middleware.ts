import Send from "@utils/response.utils";
import { Request, Response } from "express";

export function notFoundMiddleware(req: Request, res: Response) {
  return Send.notFound(
    res,
    {
      path: req.originalUrl,
      method: req.method,
    },
    "Route not found"
  );
}
