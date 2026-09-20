import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { ValidationError } from "../errors/ValidationError.ts";

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: "error",
      statusCode: err.statusCode,
      message: err.message,
    };

    // Erros de validação (422) incluem os erros por campo no formato da UI
    // (chave → mensagem) — opcional, não altera o envelope dos demais.
    const fields = (err as Partial<ValidationError>).fields;
    if (fields && Object.keys(fields).length > 0) {
      body.fields = fields;
    }

    res.status(err.statusCode).json(body);
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
