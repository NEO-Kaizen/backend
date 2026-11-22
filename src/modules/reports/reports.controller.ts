import type { Request, Response } from "express";
import type { EffectivePermission } from "../../shared/catalog/permissionCatalog.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { queueFilterQuerySchema } from "../queue/queue.schemas.ts";
import { dashboardQuerySchema } from "./reports.schema.ts";
import { exportQueueCsv, getDashboard, type ReportActor } from "./reports.service.ts";

/** Ator autenticado com as Permissões carregadas pelo gate da rota. */
function actorFromRequest(req: Request): ReportActor {
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

export async function getDashboardController(req: Request, res: Response): Promise<Response> {
  const parsed = dashboardQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  return res.status(200).json(await getDashboard(parsed.data));
}

export async function exportQueueCsvController(req: Request, res: Response): Promise<Response> {
  const parsed = queueFilterQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  const file = await exportQueueCsv(parsed.data, actorFromRequest(req));

  return res
    .status(200)
    .set({
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    })
    .send(file.content);
}
