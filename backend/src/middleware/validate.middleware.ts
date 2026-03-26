import { NextFunction, Request, Response } from "express";
import z from "zod";
import Send from "@utils/response.utils";

interface ValidateSchemas<
  TBody = unknown,
  TParams extends Request["params"] = Request["params"],
  TQuery extends Request["query"] = Request["query"]
> {
  body?: z.ZodType<TBody>;
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
}

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors;
}

export function validate<
  TBody = unknown,
  TParams extends Request["params"] = Request["params"],
  TQuery extends Request["query"] = Request["query"]
>(schemas: ValidateSchemas<TBody, TParams, TQuery>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        Object.assign(errors, toFieldErrors(result.error));
      } else {
        req.body = result.data as Request["body"];
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        Object.assign(errors, toFieldErrors(result.error));
      } else {
        req.params = result.data as Request["params"];
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        Object.assign(errors, toFieldErrors(result.error));
      } else {
        req.query = result.data as Request["query"];
      }
    }

    if (Object.keys(errors).length > 0) {
      return Send.validationErrors(res, errors);
    }
    return next();
  };
}
