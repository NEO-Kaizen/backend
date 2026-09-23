import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { queueFilterQuerySchema } from "../queue/queue.schemas.ts";
import { dashboardQuerySchema } from "./reports.schema.ts";
import { exportQueueCsv, getDashboard } from "./reports.service.ts";

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

  const file = await exportQueueCsv(parsed.data);

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
