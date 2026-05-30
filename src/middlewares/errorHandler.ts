import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { ZodError } from "zod";

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
    const formattedErrors = err.issues.reduce(
      (acc, issue) => {
        const field = issue.path.join(".");
        if (issue.code === "invalid_type") {
          acc[field] =
            `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        } else {
          acc[field] = issue.message;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: formattedErrors,
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
