import type { Request, Response } from "express";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { getQueueMetricsService, listQueueService, type QueueActor } from "./queue.service.ts";
import { queueQuerySchema } from "./queue.schemas.ts";

/** Ator autenticado com as Permissões carregadas pelo gate da rota. */
function actorFromRequest(req: Request): QueueActor {
  if (!req.user) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const id = Number(req.user.id);
  if (!Number.isInteger(id)) {
    throw new AppError("Token inválido ou expirado", 401);
  }

  const permissions: EffectivePermission[] | undefined = req.permissions;
  if (!permissions) {
    throw new AppError("Permissões não carregadas para esta operação", 403);
  }

  return { id, permissions };
}

export const getMetricsController = async (req: Request, res: Response): Promise<Response> => {
  const metrics = await getQueueMetricsService(actorFromRequest(req));

  return res.status(200).json(metrics);
};

export const centralizedQueue = async (req: Request, res: Response): Promise<Response> => {
  const parsed = queueQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  const result = await listQueueService(parsed.data, actorFromRequest(req));

  return res.status(200).json(result);
};
