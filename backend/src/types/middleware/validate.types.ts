import type { Request } from "express";
import type z from "zod";

export interface ValidateSchemas<
  TBody = unknown,
  TParams extends Request["params"] = Request["params"],
  TQuery extends Request["query"] = Request["query"]
> {
  body?: z.ZodType<TBody>;
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
}
