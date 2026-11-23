import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError.ts";
import { formatZodIssues } from "../../shared/validation/zodErrors.ts";
import { queueFilterQuerySchema } from "../queue/queue.schemas.ts";
import { dashboardQuerySchema, requestPdfExportSchema } from "./reports.schema.ts";
import {
  exportQueueCsv,
  getDashboard,
  getGenerateRequestPDF,
  getRequesterRequestPDF,
} from "./reports.service.ts";

export async function getReportPdfController(req: Request, res: Response) {
  const parsed = requestPdfExportSchema.safeParse(req.params);

  if (!parsed.success) {
    throw new AppError(formatZodIssues(parsed.error, "params"), 400);
  }

  const pdfBuffer = await getGenerateRequestPDF({ protocol: parsed.data.protocol });

  return res
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-solicitacao-${parsed.data.protocol}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    })
    .send(pdfBuffer);
}

export async function getRequesterRequestPdfController(
  req: Request,
  res: Response,
): Promise<Response> {
  const rawProtocol = req.params.protocol;
  const protocol = typeof rawProtocol === "string" ? rawProtocol.trim() : "";

  if (!protocol) {
    throw new AppError("Protocolo é obrigatório", 400);
  }

  const pdfBuffer = await getRequesterRequestPDF(protocol, {
    user: req.user,
    requesterIdentity: req.requesterIdentity ?? null,
  });

  return res
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="solicitacao-${protocol}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    })
    .send(pdfBuffer);
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
