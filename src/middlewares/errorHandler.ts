import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import z, { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  //Zod validation error

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: z.treeifyError(err),
    });
    return;
  }

  //Known app error

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  //Unknown error
  logger.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
