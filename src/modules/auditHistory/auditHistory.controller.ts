import type { Request, Response } from "express";
import { permissionActorFromRequest } from "../../shared/access/requestAccess.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { auditHistoryQuerySchema } from "./auditHistory.schema.ts";
import {
  listAuditHistoryLogs,
  getAuditHistoryDetail,
  listAuditLogsByProtocol,
} from "./auditHistory.service.ts";

export async function listAuditHistoryController(req: Request, res: Response): Promise<Response> {
  const parsed = auditHistoryQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  return res
    .status(200)
    .json(await listAuditHistoryLogs(parsed.data, permissionActorFromRequest(req)));
}

export async function getAuditHistoryDetailController(
  req: Request,
  res: Response,
): Promise<Response> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("ID inválido", 400);
  }

  const detail = await getAuditHistoryDetail(id, permissionActorFromRequest(req), req.ip);
  return res.status(200).json(detail);
}

export async function getAuditLogsByProtocolController(
  req: Request,
  res: Response,
): Promise<Response> {
  const protocol = String(req.params.protocol ?? "").trim();
  if (protocol === "") {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  const logs = await listAuditLogsByProtocol(protocol, permissionActorFromRequest(req), req.ip);

  return res.status(200).json(logs);
}
