import type { NextFunction, Request, Response } from "express";

export interface AsyncRequestHandler {
  (req: Request, res: Response, next: NextFunction): Promise<unknown>;
}
