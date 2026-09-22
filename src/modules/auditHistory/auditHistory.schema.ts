import { z } from "zod";
import type { AuditHistoryQuery } from "../DTOs/auditHistory/AuditHistory.dto.ts";

const optionalPositiveInt = z.coerce.number().int().positive().optional();

export const auditHistoryQuerySchema = z
  .object({
    page: optionalPositiveInt,
    limit: z.coerce.number().int().positive().max(100).optional(),
    entityType: z
      .enum(["user", "prioritization", "request", "mapping", "settings", "pending_item"])
      .optional(),
  })
  .strict()
  .refine((query) => !query.page || query.page >= 1, {
    message: "Page deve ser maior ou igual a 1.",
    path: ["page"],
  })
  .refine((query) => !query.limit || query.limit <= 100, {
    message: "Limit não pode exceder 100.",
    path: ["limit"],
  })
  .refine((query) => !query.page || !query.limit || query.page >= 1, {
    message: "Page inválido.",
    path: ["page"],
  })
  .transform((query) => ({
    page: query.page ?? 1,
    limit: query.limit ?? 20,
    entityType: query.entityType ?? undefined,
  })) satisfies z.ZodType<AuditHistoryQuery>;
