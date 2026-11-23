import { z } from "zod";
import type { DashboardQuery } from "../DTOs/reports/Dashboard.dto.ts";
import type { RequestPdfExport } from "../DTOs/reports/RequestPdfExport.dto.ts";

const optionalDate = z.iso.date("Data inválida — use o formato AAAA-MM-DD.").optional();
const optionalId = z.coerce.number().int().positive().optional();


export const requestPdfExportSchema = z
  .object({
    protocol: z.string().regex(/^MAAT-[A-Z0-9-]{6,20}$/, "Protocolo inválido."),
  })
  .strict()
  .transform((data) => ({
    protocol: data.protocol,
  })) satisfies z.ZodType<RequestPdfExport>;

export const dashboardQuerySchema = z
  .object({
    from: optionalDate,
    to: optionalDate,
    situation: z.enum(["open", "closed", "overdue", "unassigned"]).optional(),
    statusId: optionalId,
    categoryId: optionalId,
    priorityId: z.union([z.coerce.number().int().positive(), z.literal("unassigned")]).optional(),
  })
  .strict()
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "A data inicial não pode ser posterior à data final.",
    path: ["from"],
  }) satisfies z.ZodType<DashboardQuery>;
