import { RequestHandler } from "express";
import type { AsyncRequestHandler } from "types/utils/async-handler.types";

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}