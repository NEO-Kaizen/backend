import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { auditHistoryQuerySchema } from "./auditHistory.schema.ts";
import { listAuditHistoryLogs, getAuditHistoryDetail } from "./auditHistory.service.ts";

export async function listAuditHistoryController(req: Request, res: Response): Promise<Response> {
  const parsed = auditHistoryQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  return res.status(200).json(await listAuditHistoryLogs(parsed.data));
}

export async function getAuditHistoryDetailController(
  req: Request,
  res: Response,
): Promise<Response> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("ID inválido", 400);
  }

  const detail = await getAuditHistoryDetail(id);
  return res.status(200).json(detail);
}
