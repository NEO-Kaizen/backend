import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  const maybeHttp = err as Partial<AppError> & { status?: number };
  const statusCode = maybeHttp.status ?? maybeHttp.statusCode ?? 500;

  console.error("[Unhandled Error]", req.method, req.url, err);

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: statusCode >= 500 ? "Internal Server Error" : err.message,
  });
}
