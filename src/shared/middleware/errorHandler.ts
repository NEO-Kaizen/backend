import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.ts";
import { ValidationError } from "../errors/ValidationError.ts";

const PG_ERROR_MAP: Record<string, { statusCode: number; message: string }> = {
  "23505": { statusCode: 409, message: "Registro já existe." },
  "23503": { statusCode: 409, message: "Registro relacionado não encontrado." },
  "23502": { statusCode: 400, message: "Campo obrigatório ausente." },
};

function isPostgresError(err: Error): boolean {
  const maybe = err as Partial<AppError> & { code?: string };
  return typeof maybe.code === "string" && maybe.code.startsWith("23");
}

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

    // Código de erro estável para a UI (delta `portal-config-statuses-amend.md`).
    if (err.code) {
      body.code = err.code;
    }

    // Erros de validação (422) incluem os erros por campo no formato da UI
    // (chave → mensagem) — opcional, não altera o envelope dos demais.
    const fields = (err as Partial<ValidationError>).fields;
    if (fields && Object.keys(fields).length > 0) {
      body.fields = fields;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  if (isPostgresError(err)) {
    const pgCode = (err as Partial<AppError> & { code?: string }).code ?? "";
    const mappedError = PG_ERROR_MAP[pgCode];

    if (mappedError) {
      res.status(mappedError.statusCode).json({
        status: "error",
        statusCode: mappedError.statusCode,
        message: mappedError.message,
      });
      return;
    }

    console.error("[Erro não tratado]", req.method, req.url, err);

    res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Erro interno do servidor",
    });
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
