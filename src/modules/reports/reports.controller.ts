import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { dashboardQuerySchema } from "./reports.schema.ts";
import { getDashboard } from "./reports.service.ts";

export async function getDashboardController(req: Request, res: Response): Promise<Response> {
  const parsed = dashboardQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "query"), 400);
  }

  return res.status(200).json(await getDashboard(parsed.data));
}
