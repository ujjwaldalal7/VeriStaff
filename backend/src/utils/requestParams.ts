import type { Request } from "express";
import { ApiError } from "./apiError.js";

export function getRequiredParam(
  req: Request,
  name: string
): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, `${name} is required`);
  }

  return value;
}