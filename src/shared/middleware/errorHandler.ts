import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const payload: {
      status: string;
      statusCode: number;
      message: string;
      fields?: Record<string, string>;
    } = {
      status: "error",
      statusCode: err.statusCode,
      message: err.message,
    };

    if (err.details && Object.keys(err.details).length > 0) {
      payload.fields = err.details;
    }

    res.status(err.statusCode).json(payload);
    return;
  }

  const maybeHttp = err as Partial<AppError> & { status?: number };
  const statusCode = maybeHttp.status ?? maybeHttp.statusCode ?? 500;

  console.error("[Erro não tratado]", req.method, req.url, err);

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message: statusCode >= 500 ? "Erro interno do servidor" : err.message,
  });
}
